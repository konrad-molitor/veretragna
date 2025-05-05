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

export class TripsSearchService {
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

  //   Helper function for determining the start of the day of week
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

  // Function for converting a trip to segments
  private buildSegments(trip: Trip): Segment[] {
    const segs: Segment[] = [];
    const stops = [...trip.schedule.route.stops]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    for (let i = 0; i < stops.length - 1; i++) {
      const A = stops[i];
      const B = stops[i + 1];

      const base = Number(B.price) || 0;
      const withBoard = i === 0 // first segment of the trip
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

  // Function for creating segment index
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

  // Binary search function - finds the index of the first element >= target
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
    /* --- internal types for search --- */
    interface Node { locId: string; time: Date; tripId?: string }

    const INF = new Date(8640000000000000);
    const best = new Map<string, Date>();
    const prev = new Map<string, { prevLoc: string; seg: Segment }>();
    const pq = new TinyQueue<Node>([], (a, b) => +a.time - +b.time);

    best.set(fromId, earliest);
    pq.push({ locId: fromId, time: earliest });

    /* ---------- search ---------- */
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

    /* ---------- segment recovery ---------- */
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

    /* Get trips from DB */
    const trips = await this.loadTrips(rangeStart, rangeEnd);

    /* Segments + index + meta */
    const allSegments: Segment[] = [];
    const tripMeta = new Map<string, { capacity: number; booked: number }>();

    for (const t of trips) {
      allSegments.push(...this.buildSegments(t));
      tripMeta.set(t.id, { capacity: t.capacity || Number.MAX_SAFE_INTEGER, booked: t.bookedSeats || 0 });
    }
    const segmentIndex = this.createSegmentIndex(allSegments);
    
    if (!segmentIndex.has(fromId)) {
      console.warn('No segments from departure point; '
                 + 'check buildSegments() and departLocId');
    }

    /* Outbound search */
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

    /* Return search */
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

// Export service instance
export const tripsSearchService = new TripsSearchService();
