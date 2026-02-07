// Core types for Spotify listening data

export interface ListeningEvent {
  ts: string;
  ms_played: number;
  shuffle: boolean;
  skipped: boolean;
  master_metadata_track_name: string;
  master_metadata_album_artist_name: string;
  spotify_track_uri: string;
  platform: string;
  // Optional fields that may exist
  master_metadata_album_album_name?: string;
  reason_start?: string;
  reason_end?: string;
}

export interface EnrichedListeningEvent extends ListeningEvent {
  artistGenres: string[];
  timestamp: Date;
  trackId: string;
  artistId?: string;
  duration?: number; // Track duration in ms
  completionRatio: number; // ms_played / duration
  isActive: boolean; // Calculated based on completion, shuffle, skip
}

export interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  events: EnrichedListeningEvent[];
  duration: number; // Total session duration in ms
  totalListeningTime: number; // Actual listening time
  trackCount: number;
  averageActiveScore: number;
}

export interface RepeatMetrics {
  totalRepeats: number;
  repeatRate: number; // Percentage of listens that are repeats
  mostRepeatedTracks: Array<{
    track: string;
    artist: string;
    count: number;
  }>;
  averageTimeBetweenRepeats: number; // In hours
  sameArtistStreaks: Array<{
    artist: string;
    length: number;
    startTime: Date;
  }>;
}

export interface LoyaltyScore {
  topArtistPercentage: number; // % of listens from top 10 artists
  uniqueArtistsPerWeek: number;
  giniCoefficient: number; // 0 = perfect equality, 1 = one artist only
  explorationScore: number; // 0-1, higher = more exploration
  loyaltyLabel: 'Highly Loyal' | 'Balanced' | 'Explorer';
}

export interface GenreStats {
  distribution: Array<{
    genre: string;
    count: number;
    percentage: number;
  }>;
  topGenres: string[];
  genreDiversity: number; // Shannon entropy
  genreEvolution: Array<{
    date: Date;
    genres: { [genre: string]: number };
  }>;
  genreByTimeOfDay: {
    [hour: number]: { [genre: string]: number };
  };
}

export interface BehavioralMetrics {
  activeScore: number; // 0-1
  shuffleRate: number;
  skipRate: number;
  averageCompletionRatio: number;
  averageSessionLength: number; // In minutes
  repeatMetrics: RepeatMetrics;
  loyaltyScore: LoyaltyScore;
  genreStats: GenreStats;
}

export interface ListenerArchetype {
  primary: string;
  secondary?: string;
  confidence: number; // 0-1
  traits: string[];
  description: string;
}

export interface ListenerProfile {
  totalListens: number;
  totalListeningTime: number; // In hours
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: BehavioralMetrics;
  archetype: ListenerArchetype;
  topArtists: Array<{
    name: string;
    count: number;
    genres: string[];
  }>;
  topTracks: Array<{
    name: string;
    artist: string;
    count: number;
  }>;
}

export interface CleaningStats {
  originalCount: number;
  filteredCount: number;
  removedShort: number;
  removedDuplicates: number;
  sessionCount: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: Array<{
    id: string;
    name: string;
  }>;
}

// API Response types
export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface GenreEnrichmentRequest {
  trackUris: string[];
}

export interface GenreEnrichmentResponse {
  trackGenres: {
    [trackId: string]: string[];
  };
  artistCache: {
    [artistId: string]: string[];
  };
}

// UI State types
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
}

export interface EnrichmentState {
  isEnriching: boolean;
  progress: number;
  currentBatch: number;
  totalBatches: number;
  error?: string;
}

export interface AppState {
  rawEvents: ListeningEvent[];
  enrichedEvents: EnrichedListeningEvent[];
  profile?: ListenerProfile;
  uploadState: UploadState;
  enrichmentState: EnrichmentState;
  isProcessing: boolean;
}
