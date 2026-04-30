export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  venue_name: string | null;
  address: string | null;
  lat: number;
  lng: number;
  start_time: string;
  end_time: string | null;
  price_info: string | null;
  source_url: string | null;
  source_name: string | null;
  image_url: string | null;
  distance_km: number;
}

export type EventCategory =
  | 'musica'
  | 'cinema'
  | 'cultura'
  | 'mercato'
  | 'sport'
  | 'nightlife'
  | 'food'
  | 'teatro'
  | 'altro';

export interface Coordinates {
  latitude: number;
  longitude: number;
}
