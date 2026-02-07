'use client';

import { useCallback } from 'react';
import { useListeningData } from '@/context/ListeningDataContext';
import { parseSpotifyJSON } from '@/lib/data/parser';
import { cleanListeningData, enrichEvents, getUniqueTrackIds } from '@/lib/data/cleaner';
import { calculateBehavioralMetrics } from '@/lib/analytics/metrics';
import { classifyListener } from '@/lib/analytics/classifier';
import { ListenerProfile, EnrichedListeningEvent } from '@/types/listening';

export function useListeningAnalytics() {
  const {
    rawEvents,
    enrichedEvents,
    setRawEvents,
    setEnrichedEvents,
    setProfile,
    setUploadProgress,
    setEnrichmentProgress,
    setIsProcessing,
    setUploadError,
    setEnrichmentError,
  } = useListeningData();
  
  /**
   * Process uploaded JSON file
   */
  const processFile = useCallback(async (fileContent: string) => {
    try {
      setIsProcessing(true);
      setUploadProgress(0);
      
      // Parse JSON
      setUploadProgress(10);
      const parsed = parseSpotifyJSON(fileContent);
      
      // Clean data
      setUploadProgress(30);
      const { cleaned } = cleanListeningData(parsed);
      
      // Basic enrichment (without Spotify API)
      setUploadProgress(50);
      const enriched = enrichEvents(cleaned);
      
      setUploadProgress(100);
      setRawEvents(cleaned);
      setEnrichedEvents(enriched);
      
      return enriched;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process file';
      setUploadError(message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [setRawEvents, setEnrichedEvents, setUploadProgress, setIsProcessing, setUploadError]);
  
  /**
   * Enrich data with Spotify API (genres, etc.)
   */
  const enrichWithSpotify = useCallback(async (events: EnrichedListeningEvent[]) => {
    try {
      setIsProcessing(true);
      setEnrichmentProgress(0, 0, 0);
      
      // Get unique track URIs
      const trackUris = [...new Set(events.map(e => e.spotify_track_uri))];
      const batchSize = 50;
      const totalBatches = Math.ceil(trackUris.length / batchSize);
      
      let allTrackGenres: { [trackId: string]: string[] } = {};
      
      // Process in batches
      for (let i = 0; i < totalBatches; i++) {
        const batch = trackUris.slice(i * batchSize, (i + 1) * batchSize);
        
        const response = await fetch('/api/spotify/genres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackUris: batch }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch genre data from Spotify');
        }
        
        const data = await response.json();
        allTrackGenres = { ...allTrackGenres, ...data.trackGenres };
        
        const progress = ((i + 1) / totalBatches) * 100;
        setEnrichmentProgress(progress, i + 1, totalBatches);
      }
      
      // Update events with genres
      const fullyEnriched = events.map(event => ({
        ...event,
        artistGenres: allTrackGenres[event.trackId] || [],
      }));
      
      setEnrichedEvents(fullyEnriched);
      return fullyEnriched;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enrich data';
      setEnrichmentError(message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [setEnrichedEvents, setEnrichmentProgress, setIsProcessing, setEnrichmentError]);
  
  /**
   * Generate complete listener profile
   */
  const generateProfile = useCallback((events: EnrichedListeningEvent[]): ListenerProfile => {
    if (events.length === 0) {
      throw new Error('No events to analyze');
    }
    
    // Calculate metrics
    const metrics = calculateBehavioralMetrics(events);
    
    // Classify listener
    const archetype = classifyListener(metrics);
    
    // Get date range
    const timestamps = events.map(e => e.timestamp.getTime());
    const dateRange = {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps)),
    };
    
    // Calculate totals
    const totalListeningTime = events.reduce((sum, e) => sum + e.ms_played, 0) / (1000 * 60 * 60); // Hours
    
    // Top artists
    const artistCounts = new Map<string, { count: number; genres: Set<string> }>();
    events.forEach(event => {
      const artist = event.master_metadata_album_artist_name;
      if (!artistCounts.has(artist)) {
        artistCounts.set(artist, { count: 0, genres: new Set() });
      }
      const data = artistCounts.get(artist)!;
      data.count++;
      event.artistGenres.forEach(g => data.genres.add(g));
    });
    
    const topArtists = Array.from(artistCounts.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        genres: Array.from(data.genres),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Top tracks
    const trackCounts = new Map<string, { artist: string; count: number }>();
    events.forEach(event => {
      const trackKey = `${event.master_metadata_track_name}|||${event.master_metadata_album_artist_name}`;
      if (!trackCounts.has(trackKey)) {
        trackCounts.set(trackKey, { artist: event.master_metadata_album_artist_name, count: 0 });
      }
      trackCounts.get(trackKey)!.count++;
    });
    
    const topTracks = Array.from(trackCounts.entries())
      .map(([trackKey, data]) => {
        const [name] = trackKey.split('|||');
        return {
          name,
          artist: data.artist,
          count: data.count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const profile: ListenerProfile = {
      totalListens: events.length,
      totalListeningTime,
      dateRange,
      metrics,
      archetype,
      topArtists,
      topTracks,
    };
    
    setProfile(profile);
    return profile;
  }, [setProfile]);
  
  return {
    rawEvents,
    enrichedEvents,
    processFile,
    enrichWithSpotify,
    generateProfile,
  };
}
