import {
  addDays, addHours, addMinutes, endOfDay, startOfDay,
} from 'date-fns';
import { Between } from 'typeorm';
import { Trip, TripStatus } from './trip.entity';
import { DayOfWeek, Schedule } from '../schedules/schedule.entity';
import { Location } from '../locations/location.entity';
import { RouteStop } from '../routes/route-stop.entity';
import { TinyQueue } from './tiny-queue';

interface Segment {
  tripId: string;
  departTime: Date;
  arriveTime: Date;
  price: number;
  departLocId: string;
  arriveLocId: string;
  departSeq: number;
  arriveSeq: number;
}

interface Leg {
    tripId: string;
    boardSeq: number;
    alightSeq: number;
    boardTime: Date;
    alightTime: Date;
    price: number;
}

// Вспомогательный класс для приоритетной очеред

export class TripsSearchService {
  // Функция для материализации рейсов на основе расписания
//   async materialiseTrips(rangeStart: Date, rangeEnd: Date): Promise<Trip[]> {
//     const schedules = await Schedule.find({
//       where: { isActive: true },
//       relations: ['route', 'route.stops', 'route.stops.location'],
//     });

  //     const materializedTrips: Trip[] = [];

  //     for (const sched of schedules) {
  //       let date = this.startOfWeekday(rangeStart, sched.dayOfWeek);
  //       while (date <= rangeEnd) {
  //         const [hours, minutes, seconds] = sched.departureTime.split(':').map(Number);
  //         const departure = new Date(date);
  //         departure.setHours(hours, minutes, seconds);

  //         const routeDuration = Math.max(
  //           ...sched.route.stops.map((s) => s.timeOffsetMinutesArrival + s.stopDurationMinutes),
  //         );

  //         const arrival = addMinutes(departure, routeDuration);

  //         const trip = Trip.create({
  //           schedule: sched,
  //           scheduleId: sched.id,
  //           departureDateTime: departure,
  //           arrivalDateTime: arrival,
  //         });

  //         materializedTrips.push(trip);
  //         date = addDays(date, 7); // следующий тот же день недели
  //       }
  //     }

  // return materializedTrips;
  //   }
  private async loadTrips(rangeStart: Date, rangeEnd: Date): Promise<Trip[]> {
    return Trip.find({
      where: {
        status: TripStatus.SCHEDULED,
        departureDateTime: Between(rangeStart, rangeEnd),
      },
      relations: [
        'schedule',
        'schedule.route',
        'schedule.route.stops',
        'schedule.route.stops.location',
      ],
    });
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
  private buildSegments(trip: Trip): Segment[] {
    const segs: Segment[] = [];
    const stops = [...trip.schedule.route.stops]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    for (let i = 0; i < stops.length - 1; i++) {
      const A = stops[i];
      const B = stops[i + 1];

      const base = Number(B.price) || 0;
      const withBoard = i === 0 // первый сегмент Trip‑а
        ? base + Number(trip.schedule.route.boardingPrice || 0)
        : base;
      segs.push({
        tripId: trip.id,
        departSeq: A.sequenceOrder,
        arriveSeq: B.sequenceOrder,
        departLocId: A.location.id,
        arriveLocId: B.location.id,
        departTime: addMinutes(trip.departureDateTime, A.timeOffsetMinutesArrival),
        arriveTime: addMinutes(trip.departureDateTime, B.timeOffsetMinutesArrival),
        price: withBoard,
      });
    }
    return segs;
  }

  // Функция для создания индекса сегментов
  createSegmentIndex(allSegments: Segment[]): Map<string, Segment[]> {
    const segmentIndex = new Map<string, Segment[]>();

    for (const seg of allSegments) {
      if (!segmentIndex.has(seg.departLocId)) {
        segmentIndex.set(seg.departLocId, []);
      }
      segmentIndex.get(seg.departLocId)!.push(seg);
    }

    for (const [_, list] of segmentIndex) {
      list.sort((x, y) => +x.departTime - +y.departTime);
    }

    return segmentIndex;
  }

  // Функция для двоичного поиска - находит индекс первого элемента >= target
  private lowerBound(arr: Segment[], targetTime: number): number {
    let left = 0;
    let right = arr.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (+arr[mid].departTime < targetTime) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  async findPath(
    fromId: string,
    toId: string,
    earliest: Date,
    idx: Map<string, Segment[]>,
    tripMeta: Map<string, { capacity: number; booked: number }>,
    minTransferMs = 5 * 60_000,
  ): Promise<Leg[] | null> {
    /* --- внутренние типы для поиска --- */
    interface Node { locId: string; time: Date; tripId?: string }

    const INF = new Date(8640000000000000);
    const best = new Map<string, Date>();
    const prev = new Map<string, { prevLoc: string; seg: Segment }>();
    const pq = new TinyQueue<Node>([], (a, b) => +a.time - +b.time);

    best.set(fromId, earliest);
    pq.push({ locId: fromId, time: earliest });

    /* ---------- поиск ---------- */
    while (pq.length) {
      const { locId, time, tripId: arrivedVia } = pq.pop()!;
      if (+time !== +(best.get(locId) ?? INF)) continue;
      if (locId === toId) break;

      const list = idx.get(locId) ?? [];
      const start = this.lowerBound(list, +time);

      for (let i = start; i < list.length; i++) {
        const s = list[i];
        const meta = tripMeta.get(s.tripId);
        if (meta && meta.booked >= meta.capacity) continue;

        const buffer = (!arrivedVia || arrivedVia === s.tripId) ? 0 : minTransferMs;
        if (+s.departTime < +time + buffer) continue;

        if (s.arriveTime < (best.get(s.arriveLocId) ?? INF)) {
          best.set(s.arriveLocId, s.arriveTime);
          prev.set(s.arriveLocId, { prevLoc: locId, seg: s });
          pq.push({ locId: s.arriveLocId, time: s.arriveTime, tripId: s.tripId });
        }
      }
    }

    if (!best.has(toId)) return null;

    /* ---------- восстановление Segment‑ов ---------- */
    const chain: Segment[] = [];
    for (let cur = toId; cur !== fromId;) {
      const p = prev.get(cur);
      if (!p) return null;
      chain.push(p.seg);
      cur = p.prevLoc;
    }
    chain.reverse();

    const legs: Leg[] = [];
    for (const s of chain) {
      const last = legs[legs.length - 1];

      // склеиваем только если тот же Trip И сегменты идут подряд
      const shouldMerge = last
    && last.tripId === s.tripId
    && last.alightSeq === s.departSeq;

      if (shouldMerge) {
        last.alightSeq = s.arriveSeq;
        last.alightTime = s.arriveTime;
        last.price += s.price; // number + number
      } else {
        legs.push({
          tripId: s.tripId,
          boardSeq: s.departSeq,
          alightSeq: s.arriveSeq,
          boardTime: s.departTime,
          alightTime: s.arriveTime,
          price: s.price,
        });
      }
    }

    return legs;
  }

  async findRoundTrip(
    fromId: string,
    toId: string,
    dateStart: Date,
    dateReturn: Date,
    minTransferMs = 5 * 60_000,
    searchWindowDays = 30,
  ): Promise<{ outbound: Leg[] | null; inbound: Leg[] | null }> {
    const rangeStart = startOfDay(dateStart);
    const rangeEnd = endOfDay(addDays(dateReturn, searchWindowDays));

    /* Trip‑ы берём из БД */
    const trips = await this.loadTrips(rangeStart, rangeEnd);
    console.log('trips', trips.length);
    console.log('firts trip', JSON.stringify(trips[0], null, 2));

    /* Сегменты + индекс + мета */
    const allSegments: Segment[] = [];
    const tripMeta = new Map<string, { capacity: number; booked: number }>();

    for (const t of trips) {
      allSegments.push(...this.buildSegments(t));
      tripMeta.set(t.id, { capacity: t.capacity || Number.MAX_SAFE_INTEGER, booked: t.bookedSeats || 0 });
    }
    const segmentIndex = this.createSegmentIndex(allSegments);
    console.log('Segments from', fromId, '→', segmentIndex.get(fromId)?.length);
    console.log('Segments toward', toId, '(arrive) …', segmentIndex.get(toId)?.length);
    if (!segmentIndex.has(fromId)) {
      console.warn('Из точки отправления вообще нет сегментов; '
                 + 'проверь buildSegments() и departLocId');
    }

    /* Поиск туда */
    const outbound = await this.findPath(
      fromId,
      toId,
      dateStart,
      segmentIndex,
      tripMeta,
      minTransferMs,
    );
    if (!outbound) return { outbound: null, inbound: null };
    const arriveOutbound = outbound.at(-1)!.alightTime;
    const earliestReturn = new Date(Math.max(+dateReturn, +addHours(arriveOutbound, 1)));

    /* Поиск обратно */
    const inbound = await this.findPath(
      toId,
      fromId,
      earliestReturn,
      segmentIndex,
      tripMeta,
      minTransferMs,
    );

    return { outbound, inbound };
  }
}

// Экспортируем инстанцию сервиса
export const tripsSearchService = new TripsSearchService();
