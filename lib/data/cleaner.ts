import { ListeningEvent, EnrichedListeningEvent, Session, CleaningStats } from '@/types/listening';
import { CONFIG } from '@/lib/config';
import { extractTrackId } from './parser';

/**
 * Clean and normalize listening data
 */
export function cleanListeningData(events: ListeningEvent[]): {
  cleaned: ListeningEvent[];
  stats: CleaningStats;
} {
  const stats: CleaningStats = {
    originalCount: events.length,
    filteredCount: 0,
    removedShort: 0,
    removedDuplicates: 0,
    sessionCount: 0,
  };
  
  // Filter out short plays
  let cleaned = events.filter(event => {
    if (event.ms_played < CONFIG.MIN_PLAY_DURATION_MS) {
      stats.removedShort++;
      return false;
    }
    return true;
  });
  
  // Remove exact duplicates (same track, same timestamp)
  const seen = new Set<string>();
  cleaned = cleaned.filter(event => {
    const key = `${event.spotify_track_uri}-${event.ts}`;
    if (seen.has(key)) {
      stats.removedDuplicates++;
      return false;
    }
    seen.add(key);
    return true;
  });
  
  stats.filteredCount = cleaned.length;
  
  return { cleaned, stats };
}

/**
 * Create sessions from listening events based on time gaps
 */
export function createSessions(events: EnrichedListeningEvent[]): Session[] {
  if (events.length === 0) return [];
  
  const sessions: Session[] = [];
  let currentSession: EnrichedListeningEvent[] = [events[0]];
  let sessionId = 1;
  
  for (let i = 1; i < events.length; i++) {
    const prevEvent = events[i - 1];
    const currentEvent = events[i];
    
    const timeDiff = currentEvent.timestamp.getTime() - prevEvent.timestamp.getTime();
    
    if (timeDiff > CONFIG.SESSION_GAP_MS) {
      // Start new session
      sessions.push(buildSession(sessionId.toString(), currentSession));
      sessionId++;
      currentSession = [currentEvent];
    } else {
      currentSession.push(currentEvent);
    }
  }
  
  // Add the last session
  if (currentSession.length > 0) {
    sessions.push(buildSession(sessionId.toString(), currentSession));
  }
  
  return sessions;
}

/**
 * Build a session object from events
 */
function buildSession(id: string, events: EnrichedListeningEvent[]): Session {
  const startTime = events[0].timestamp;
  const endTime = events[events.length - 1].timestamp;
  const duration = endTime.getTime() - startTime.getTime();
  
  const totalListeningTime = events.reduce((sum, e) => sum + e.ms_played, 0);
  const totalActiveScore = events.reduce((sum, e) => sum + (e.isActive ? 1 : 0), 0);
  
  return {
    id,
    startTime,
    endTime,
    events,
    duration,
    totalListeningTime,
    trackCount: events.length,
    averageActiveScore: totalActiveScore / events.length,
  };
}

/**
 * Enrich basic listening events with calculated fields
 * Note: This is partial enrichment without Spotify API data
 */
export function enrichEvents(events: ListeningEvent[]): EnrichedListeningEvent[] {
  return events.map(event => {
    const trackId = extractTrackId(event.spotify_track_uri);
    const timestamp = new Date(event.ts);
    
    // Calculate completion ratio (we'll update this later with real track duration)
    // For now, assume average track is 3 minutes
    const estimatedDuration = 180000; // 3 minutes in ms
    const completionRatio = Math.min(event.ms_played / estimatedDuration, 1);
    
    // Calculate if this was "active" listening
    const isActive = calculateActiveListening(event, completionRatio);
    
    return {
      ...event,
      artistGenres: [], // Will be filled by Spotify API
      timestamp,
      trackId,
      completionRatio,
      isActive,
    };
  });
}

/**
 * Determine if a listening event was "active" or "passive"
 */
function calculateActiveListening(event: ListeningEvent, completionRatio: number): boolean {
  // Start with completion ratio
  let score = completionRatio;
  
  // Penalize if skipped
  if (event.skipped) {
    score -= CONFIG.ACTIVE_SCORE_SKIP_PENALTY;
  }
  
  // Small penalty for shuffle (suggests less intentional listening)
  if (event.shuffle) {
    score -= CONFIG.ACTIVE_SCORE_SHUFFLE_PENALTY;
  }
  
  return score >= CONFIG.ACTIVE_COMPLETION_THRESHOLD;
}

/**
 * Update enriched events with actual track durations and recalculate metrics
 */
export function updateWithDurations(
  events: EnrichedListeningEvent[],
  trackDurations: Map<string, number>
): EnrichedListeningEvent[] {
  return events.map(event => {
    const duration = trackDurations.get(event.trackId);
    
    if (!duration) {
      return event; // Keep existing calculation
    }
    
    const completionRatio = Math.min(event.ms_played / duration, 1);
    const isActive = calculateActiveListening(event, completionRatio);
    
    return {
      ...event,
      duration,
      completionRatio,
      isActive,
    };
  });
}

/**
 * Get unique track IDs from events
 */
export function getUniqueTrackIds(events: EnrichedListeningEvent[]): string[] {
  const uniqueIds = new Set(events.map(e => e.trackId));
  return Array.from(uniqueIds);
}

/**
 * Get unique artist names from events
 */
export function getUniqueArtists(events: ListeningEvent[]): string[] {
  const uniqueArtists = new Set(
    events.map(e => e.master_metadata_album_artist_name)
  );
  return Array.from(uniqueArtists);
}
