import { ListeningEvent } from '@/types/listening';

/**
 * Parse and validate Spotify JSON export
 */
export function parseSpotifyJSON(jsonData: string): ListeningEvent[] {
  try {
    const parsed = JSON.parse(jsonData);
    
    // Handle both array format and object with array property
    const events = Array.isArray(parsed) ? parsed : parsed.data || [];
    
    if (!Array.isArray(events)) {
      throw new Error('Invalid JSON format: expected an array of listening events');
    }
    
    // Validate and clean each event
    return events
      .filter(isValidListeningEvent)
      .map(normalizeListeningEvent);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file. Please upload a valid Spotify streaming history file.');
    }
    throw error;
  }
}

/**
 * Check if an object is a valid listening event
 */
function isValidListeningEvent(event: any): event is ListeningEvent {
  return (
    event &&
    typeof event === 'object' &&
    typeof event.ts === 'string' &&
    typeof event.ms_played === 'number' &&
    typeof event.master_metadata_track_name === 'string' &&
    typeof event.master_metadata_album_artist_name === 'string' &&
    typeof event.spotify_track_uri === 'string'
  );
}

/**
 * Normalize a listening event to ensure consistent structure
 */
function normalizeListeningEvent(event: any): ListeningEvent {
  return {
    ts: event.ts,
    ms_played: Number(event.ms_played),
    shuffle: Boolean(event.shuffle),
    skipped: Boolean(event.skipped),
    master_metadata_track_name: String(event.master_metadata_track_name || 'Unknown Track'),
    master_metadata_album_artist_name: String(event.master_metadata_album_artist_name || 'Unknown Artist'),
    spotify_track_uri: String(event.spotify_track_uri),
    platform: String(event.platform || 'unknown'),
    master_metadata_album_album_name: event.master_metadata_album_album_name,
    reason_start: event.reason_start,
    reason_end: event.reason_end,
  };
}

/**
 * Extract track ID from Spotify URI
 * Format: spotify:track:1234567890
 */
export function extractTrackId(uri: string): string {
  const parts = uri.split(':');
  return parts[parts.length - 1] || uri;
}

/**
 * Parse multiple JSON files and combine them
 */
export function parseMultipleFiles(files: string[]): ListeningEvent[] {
  const allEvents: ListeningEvent[] = [];
  
  for (const fileContent of files) {
    const events = parseSpotifyJSON(fileContent);
    allEvents.push(...events);
  }
  
  // Sort by timestamp
  return allEvents.sort((a, b) => 
    new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );
}

/**
 * Get date range from events
 */
export function getDateRange(events: ListeningEvent[]): { start: Date; end: Date } | null {
  if (events.length === 0) {
    return null;
  }
  
  const timestamps = events.map(e => new Date(e.ts).getTime());
  return {
    start: new Date(Math.min(...timestamps)),
    end: new Date(Math.max(...timestamps)),
  };
}
