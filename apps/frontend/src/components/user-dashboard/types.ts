export interface Location {
  id: string;
  name: string;
}

export interface Segment {
  tripId: string;
  boardSeq: number;
  alightSeq: number;
  boardTime: string;
  alightTime: string;
  price: number | string;
}

export interface TripRoute {
  id: string;
  type: 'outbound' | 'inbound';
  departureTime: string;
  arrivalTime: string;
  totalPrice: number;
  segments: {
    tripId: string;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
  }[];
}

export interface TripResult {
  id: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  transfers: number;
  departureLocation: string | undefined;
  arrivalLocation: string | undefined;
}

export interface SearchResponse {
  message: string;
  result: {
    outbound: Segment[] | null;
    inbound: Segment[] | null;
  };
}

export interface TripDetail {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  departureLocation?: string;
  arrivalLocation?: string;
}
