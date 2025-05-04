 
 
 
 
 
 
import {
  addDays, addHours, addMinutes, endOfDay, startOfDay,
} from 'date-fns';
import { Trip } from './trip.entity';
import { DayOfWeek, Schedule } from '../schedules/schedule.entity';
import { Location } from '../locations/location.entity';
import { RouteStop } from '../routes/route-stop.entity';

interface Segment {
  tripId: string;
  depart: { locId: string; time: Date };
  arrive: { locId: string; time: Date };
  price: number;
}

// Вспомогательный класс для приоритетной очереди
class TinyQueue<T> {
  data: T[];

  length: number;

  compare: (a: T, b: T) => number;

  constructor(data: T[] = [], compare: (a: T, b: T) => number) {
    this.data = data;
    this.length = this.data.length;
    this.compare = compare;

    if (this.length > 0) {
      for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
    }
  }

  push(item: T) {
    this.data.push(item);
    this.length++;
    this._up(this.length - 1);
  }

  pop(): T | undefined {
    if (this.length === 0) return undefined;

    const top = this.data[0];
    const bottom = this.data.pop()!;
    this.length--;

    if (this.length > 0) {
      this.data[0] = bottom;
      this._down(0);
    }

    return top;
  }

  peek(): T | undefined {
    return this.data[0];
  }

  _up(pos: number) {
    const { data, compare } = this;
    const item = data[pos];

    while (pos > 0) {
      const parent = (pos - 1) >> 1;
      const current = data[parent];
      if (compare(item, current) >= 0) break;
      data[pos] = current;
      pos = parent;
    }

    data[pos] = item;
  }

  _down(pos: number) {
    const { data, compare } = this;
    const halfLength = this.length >> 1;
    const item = data[pos];

    while (pos < halfLength) {
      let left = (pos << 1) + 1;
      let best = data[left];
      const right = left + 1;

      if (right < this.length && compare(data[right], best) < 0) {
        left = right;
        best = data[right];
      }
      if (compare(best, item) >= 0) break;

      data[pos] = best;
      pos = left;
    }

    data[pos] = item;
  }
}

export class TripsSearchService {
  // Функция для материализации рейсов на основе расписания
  async materialiseTrips(rangeStart: Date, rangeEnd: Date): Promise<Trip[]> {
    const schedules = await Schedule.find({
      where: { isActive: true },
      relations: ['route', 'route.stops', 'route.stops.location'],
    });

    const materializedTrips: Trip[] = [];

    for (const sched of schedules) {
      let date = this.startOfWeekday(rangeStart, sched.dayOfWeek);
      while (date <= rangeEnd) {
        const [hours, minutes, seconds] = sched.departureTime.split(':').map(Number);
        const departure = new Date(date);
        departure.setHours(hours, minutes, seconds);

        const routeDuration = Math.max(
          ...sched.route.stops.map((s) => s.timeOffsetMinutesArrival + s.stopDurationMinutes),
        );

        const arrival = addMinutes(departure, routeDuration);

        const trip = Trip.create({
          schedule: sched,
          scheduleId: sched.id,
          departureDateTime: departure,
          arrivalDateTime: arrival,
        });

        materializedTrips.push(trip);
        date = addDays(date, 7); // следующий тот же день недели
      }
    }

    return materializedTrips;
  }

  //   Вспомогательная функция для определения начала дня недели
  private startOfWeekday(date: Date, dayOfWeek: string): Date {
    const currentDay = date.getDay();
    let targetDay: number;

    switch (dayOfWeek.toLowerCase()) {
      case 'monday': targetDay = 1; break;
      case 'tuesday': targetDay = 2; break;
      case 'wednesday': targetDay = 3; break;
      case 'thursday': targetDay = 4; break;
      case 'friday': targetDay = 5; break;
      case 'saturday': targetDay = 6; break;
      case 'sunday': targetDay = 0; break;
      default: targetDay = currentDay;
    }

    const diff = (targetDay - currentDay + 7) % 7;
    return diff === 0 ? date : addDays(date, diff);
  }

  // Функция для преобразования рейса в сегменты
  buildSegments(trip: Trip): Segment[] {
    const segments: Segment[] = [];
    if (!trip.schedule?.route?.stops) return segments;

    const sortedStops = [...trip.schedule.route.stops]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    for (let i = 0; i < sortedStops.length - 1; i++) {
      const A = sortedStops[i];
      const B = sortedStops[i + 1];

      segments.push({
        tripId: trip.id,
        depart: {
          locId: A.location.id,
          time: addMinutes(trip.departureDateTime, A.timeOffsetMinutesArrival),
        },
        arrive: {
          locId: B.location.id,
          time: addMinutes(trip.departureDateTime, B.timeOffsetMinutesArrival),
        },
        price: B.price || 0, // тариф за плечо
      });
    }

    return segments;
  }

  // Функция для создания индекса сегментов
  createSegmentIndex(allSegments: Segment[]): Map<string, Segment[]> {
    const segmentIndex = new Map<string, Segment[]>();

    for (const seg of allSegments) {
      if (!segmentIndex.has(seg.depart.locId)) {
        segmentIndex.set(seg.depart.locId, []);
      }
      segmentIndex.get(seg.depart.locId)!.push(seg);
    }

    for (const [_, list] of segmentIndex) {
      list.sort((x, y) => +x.depart.time - +y.depart.time);
    }

    return segmentIndex;
  }

  // Функция для двоичного поиска - находит индекс первого элемента >= target
  private lowerBound(arr: Segment[], targetTime: number): number {
    let left = 0;
    let right = arr.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (+arr[mid].depart.time < targetTime) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  // Функция для поиска пути (Time-Dependent Dijkstra)
  //   async findPath(
  //     fromId: string,
  //     toId: string,
  //     earliest: Date,
  //     segmentIndex: Map<string, Segment[]>,
  //     minTransferMs = 5 * 60_000, // 5 минут
  //   ): Promise<Segment[] | null> {
  //     interface Node { locId: string; time: Date }

  //     const best = new Map<string, Date>();
  //     const prev = new Map<string, { prevLoc: string; seg: Segment }>();
  //     const pq = new TinyQueue<Node>([], (a, b) => +a.time - +b.time);

  //     best.set(fromId, earliest);
  //     pq.push({ locId: fromId, time: earliest });

  //     while (pq.length) {
  //       const { locId, time } = pq.pop()!;

  //       if (locId === toId) break;
  //       if (+time > +(best.get(locId) || new Date(8640000000000000))) continue;

  //       const list = segmentIndex.get(locId) || [];

  //       // Бинарный поиск: первый сегмент с depart.time ≥ time+minTransfer
  //       const startIdx = this.lowerBound(list, +time + minTransferMs);

  //       for (let i = startIdx; i < list.length; i++) {
  //         const seg = list[i];

  //         // Проверка на свободные места (capacity)
  //         const trip = await Trip.findOne({
  //           where: { id: seg.tripId },
  //         });

  //         if (trip && trip.bookedSeats >= trip.capacity) continue;

  //         if (+seg.depart.time < +time + minTransferMs) continue;

  //         const arrTime = seg.arrive.time;
  //         if (arrTime < (best.get(seg.arrive.locId) || new Date(8640000000000000))) {
  //           best.set(seg.arrive.locId, arrTime);
  //           prev.set(seg.arrive.locId, { prevLoc: locId, seg });
  //           pq.push({ locId: seg.arrive.locId, time: arrTime });
  //         }
  //       }
  //     }

  //     if (!best.has(toId)) return null;

  //     // Восстановление пути
  //     const path: Segment[] = [];
  //     let cur = toId;
  //     while (cur !== fromId) {
  //       const p = prev.get(cur)!;
  //       path.push(p.seg);
  //       cur = p.prevLoc;
  //     }

  //     return path.reverse();
  //   }
  async findPath(
    fromId: string,
    toId: string,
    earliest: Date,
    segmentIndex: Map<string, Segment[]>,
    tripMeta: Map<string, { capacity: number; booked: number }>,
    minTransferMs = 5 * 60_000,
  ): Promise<Segment[] | null> {
    interface Node { locId: string; time: Date }

    const INF = new Date(8640000000000000); // максимально возможная дата
    const best = new Map<string, Date>(); // earliest‑arrive для каждой локации
    const prev = new Map<string, { prevLoc: string; seg: Segment }>();

    const pq = new TinyQueue<Node>([], (a, b) => +a.time - +b.time);

    best.set(fromId, earliest);
    pq.push({ locId: fromId, time: earliest });

    while (pq.length) {
      const { locId, time } = pq.pop()!;

      // ранняя запись могла быть «перебита» лучше‑прибытием
      if (+time !== +(best.get(locId) ?? INF)) continue;
      if (locId === toId) break; // нашли кратчайший до цели
      const list = segmentIndex.get(locId) ?? [];
      if (!list.length) continue; // из этой точки рейсов нет

      // ► буфер только для пересадок, НЕ для первой посадки
      const buffer = locId === fromId ? 0 : minTransferMs;
      const startIdx = this.lowerBound(list, +time + buffer);

      for (let i = startIdx; i < list.length; i++) {
        const seg = list[i];
        // проверяем свободные места без обращения к БД
        const meta = tripMeta.get(seg.tripId);
        if (meta && meta.booked >= meta.capacity) continue;
        if (+seg.depart.time < +time + buffer) continue; // те же 5 мин, но уже после binary‑search
        const arrTime = seg.arrive.time;
        if (arrTime < (best.get(seg.arrive.locId) ?? INF)) {
          best.set(seg.arrive.locId, arrTime);
          prev.set(seg.arrive.locId, { prevLoc: locId, seg });
          pq.push({ locId: seg.arrive.locId, time: arrTime });
        }
      }
    }

    if (!best.has(toId)) return null; // маршрута нет

    // восстановление пути
    const path: Segment[] = [];
    for (let cur = toId; cur !== fromId;) {
      const p = prev.get(cur);
      if (!p) return null; // защитный рантайм‑чек
      path.push(p.seg);
      cur = p.prevLoc;
    }
    return path.reverse();
  }

  // Основная функция поиска билета туда-обратно
  async findRoundTrip(
    fromId: string,
    toId: string,
    dateStart: Date,
    dateReturn: Date,
    minTransferMs = 5 * 60_000,
    searchWindow = 30, // дней
  ): Promise<{ outbound: Segment[] | null; inbound: Segment[] | null }> {
    const rangeStart = startOfDay(dateStart);
    const rangeEnd = endOfDay(addDays(dateReturn, searchWindow));

    // Материализация рейсов
    const trips = await this.materialiseTrips(rangeStart, rangeEnd);

    // Создание сегментов из всех рейсов
    const allSegments: Segment[] = [];
    for (const trip of trips) {
      allSegments.push(...this.buildSegments(trip));
    }
    // Создание tripMeta для проверки свободных мест
    const tripMeta = new Map<string, { capacity: number; booked: number }>();
    for (const t of trips) {
      tripMeta.set(t.id, { capacity: t.capacity ?? 50, booked: t.bookedSeats ?? 0 });
    }

    const segStats = allSegments.reduce((m, s) => {
      m.set(s.depart.locId, (m.get(s.depart.locId) || 0) + 1);
      return m;
    }, new Map<string, number>());

    console.table([...segStats.entries()].slice(0, 10));

    // Создание индекса сегментов
    const segmentIndex = this.createSegmentIndex(allSegments);

    console.log(segmentIndex.get(fromId)?.length);
    console.log(segmentIndex.get(toId)?.length);

    // Поиск пути туда
    const outbound = await this.findPath(
      fromId,
      toId,
      dateStart,
      segmentIndex,
      tripMeta,
      minTransferMs,
    );
    console.log('outbound', outbound);
    if (!outbound) {
      return { outbound: null, inbound: null };
    }

    // Определение времени для обратного пути
    const arriveOutbound = outbound[outbound.length - 1].arrive.time;
    const earliestReturn = new Date(Math.max(
      +dateReturn,
      +addHours(arriveOutbound, 1),
    ));

    // Поиск пути обратно
    const inbound = await this.findPath(
      toId,
      fromId,
      earliestReturn,
      segmentIndex,
      tripMeta,
      minTransferMs,
    );

    console.log('inbound', inbound);

    return { outbound, inbound };
  }
}

// Экспортируем инстанцию сервиса
export const tripsSearchService = new TripsSearchService();
