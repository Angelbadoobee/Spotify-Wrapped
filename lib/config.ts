// Configuration constants for the application

export const CONFIG = {
  // Data cleaning thresholds
  MIN_PLAY_DURATION_MS: 30000, // 30 seconds - filter out accidental plays
  SESSION_GAP_MS: 30 * 60 * 1000, // 30 minutes - gap between sessions
  
  // Active listening thresholds
  ACTIVE_COMPLETION_THRESHOLD: 0.8, // 80% completion = active listening
  ACTIVE_SCORE_SKIP_PENALTY: 0.3,
  ACTIVE_SCORE_SHUFFLE_PENALTY: 0.1,
  
  // Spotify API
  SPOTIFY_API_BASE: 'https://api.spotify.com/v1',
  SPOTIFY_AUTH_URL: 'https://accounts.spotify.com/api/token',
  BATCH_SIZE: 50, // Spotify allows 50 artists per batch request
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  
  // Genre normalization
  GENRE_MAPPING: {
    'pop': ['pop', 'dance pop', 'electropop', 'synth-pop'],
    'rock': ['rock', 'indie rock', 'alternative rock', 'classic rock'],
    'hip-hop': ['hip hop', 'rap', 'trap', 'conscious hip hop'],
    'electronic': ['electronic', 'edm', 'house', 'techno', 'dubstep'],
    'r&b': ['r&b', 'contemporary r&b', 'soul', 'neo soul'],
    'indie': ['indie', 'indie pop', 'indie folk'],
    'jazz': ['jazz', 'contemporary jazz', 'smooth jazz'],
    'classical': ['classical', 'modern classical', 'baroque'],
    'country': ['country', 'contemporary country', 'country road'],
    'folk': ['folk', 'folk rock', 'americana'],
    'metal': ['metal', 'heavy metal', 'death metal', 'metalcore'],
    'latin': ['latin', 'reggaeton', 'latin pop', 'salsa'],
  },
  
  // Listener archetypes
  ARCHETYPES: {
    COMFORT_LISTENER: {
      name: 'Comfort Listener',
      traits: ['High repeat rate', 'Low exploration', 'Consistent favorites'],
      description: 'You find comfort in familiar favorites, creating a cozy musical safe space.',
    },
    EXPLORER: {
      name: 'Musical Explorer',
      traits: ['High artist diversity', 'Low repeat rate', 'Broad genre range'],
      description: 'Always seeking new sounds, you thrive on musical discovery.',
    },
    GENRE_HOPPER: {
      name: 'Genre Hopper',
      traits: ['High genre diversity', 'Mood-based listening', 'Eclectic taste'],
      description: 'You flow between genres effortlessly, matching music to moments.',
    },
    LOYAL_FAN: {
      name: 'Loyal Fan',
      traits: ['Artist loyalty', 'Deep catalog exploration', 'Consistent preferences'],
      description: 'When you find artists you love, you dive deep into their entire discography.',
    },
    OBSESSIVE_REPEATER: {
      name: 'Obsessive Repeater',
      traits: ['Extreme repeat behavior', 'Track fixation', 'Intense focus'],
      description: 'When a song hits, you play it on repeat until it\'s etched in your soul.',
    },
    PASSIVE_LISTENER: {
      name: 'Background Player',
      traits: ['High shuffle usage', 'High skip rate', 'Playlist-focused'],
      description: 'Music is your ambient companion, setting the vibe while you focus on life.',
    },
    ACTIVE_CURATOR: {
      name: 'Active Curator',
      traits: ['Low shuffle', 'Low skip rate', 'Intentional listening'],
      description: 'Every song is chosen with purpose. You craft your listening experience.',
    },
  },
  
  // Loyalty thresholds
  LOYALTY: {
    HIGH_TOP_ARTIST_THRESHOLD: 0.5, // 50% from top artists = highly loyal
    HIGH_GINI_THRESHOLD: 0.7, // High concentration
    LOW_EXPLORATION_THRESHOLD: 0.3,
  },
  
  // UI
  CHART_COLORS: {
    primary: '#FF6B9D',
    secondary: '#C56CD6',
    accent: '#FFA500',
    warm: '#FFD700',
    cool: '#6B9DFF',
    neutral: '#9CA3AF',
  },
  
  CHARTS_PER_PAGE: 8,
  TOP_ITEMS_LIMIT: 10,
} as const;

export type ArchetypeKey = keyof typeof CONFIG.ARCHETYPES;
