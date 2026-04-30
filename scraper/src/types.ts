export interface ScrapedEvent {
  title: string;
  description: string | null;
  category: EventCategory | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  start_time: string; // ISO 8601
  end_time: string | null;
  price_info: string | null;
  source_url: string | null;
  source_name: string;
  image_url: string | null;
  external_id: string;
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

export interface SourceConfig {
  name: string;
  type: 'web' | 'eventbrite' | 'serpapi';
  urls?: string[];
  cities?: string[];
  enabled: boolean;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
}
