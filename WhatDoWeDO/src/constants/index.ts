export const COLORS = {
  primary: '#FF5A5F', // Rosso caldo (stile Airbnb)
  secondary: '#00A699',
  background: '#FFFFFF',
  surface: '#F7F7F7',
  text: '#222222',
  textSecondary: '#717171',
  border: '#DDDDDD',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const CATEGORY_COLORS: Record<string, string> = {
  musica: '#E91E63',
  cinema: '#9C27B0',
  cultura: '#3F51B5',
  mercato: '#FF9800',
  sport: '#4CAF50',
  nightlife: '#673AB7',
  food: '#FF5722',
  teatro: '#795548',
  altro: '#607D8B',
};

export const CATEGORY_LABELS: Record<string, string> = {
  musica: '🎵 Musica',
  cinema: '🎬 Cinema',
  cultura: '🎨 Cultura',
  mercato: '🛍️ Mercato',
  sport: '⚽ Sport',
  nightlife: '🌙 Nightlife',
  food: '🍕 Food',
  teatro: '🎭 Teatro',
  altro: '📌 Altro',
};

export const RADIUS_OPTIONS = [1, 3, 5, 10, 25, 50];

// Default: center of Italy (for fallback)
export const DEFAULT_LOCATION = {
  latitude: 41.9028,
  longitude: 12.4964,
};

export const DEFAULT_RADIUS_KM = 10;
