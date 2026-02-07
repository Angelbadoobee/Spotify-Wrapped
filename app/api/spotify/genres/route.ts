import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyClient } from '@/lib/spotify/client';
import { GenreEnrichmentRequest, GenreEnrichmentResponse } from '@/types/listening';

export async function POST(request: NextRequest) {
  try {
    const body: GenreEnrichmentRequest = await request.json();
    const { trackUris } = body;
    
    if (!trackUris || !Array.isArray(trackUris)) {
      return NextResponse.json(
        { error: 'Invalid request: trackUris array required' },
        { status: 400 }
      );
    }
    
    const client = getSpotifyClient();
    
    // Extract track IDs from URIs
    const trackIds = trackUris.map(uri => {
      const parts = uri.split(':');
      return parts[parts.length - 1];
    });
    
    // Fetch track details to get artist IDs
    const tracks = await client.getTracks(trackIds);
    
    // Collect unique artist IDs
    const artistIds = new Set<string>();
    tracks.forEach(track => {
      track.artists.forEach(artist => {
        artistIds.add(artist.id);
      });
    });
    
    // Fetch artist details to get genres
    const artists = await client.getArtists(Array.from(artistIds));
    
    // Build track ID -> genres mapping
    const trackGenres: { [trackId: string]: string[] } = {};
    const artistCache: { [artistId: string]: string[] } = {};
    
    tracks.forEach((track, trackId) => {
      const genres: string[] = [];
      track.artists.forEach(artist => {
        const artistData = artists.get(artist.id);
        if (artistData) {
          genres.push(...artistData.genres);
          artistCache[artist.id] = artistData.genres;
        }
      });
      trackGenres[trackId] = [...new Set(genres)]; // Remove duplicates
    });
    
    const response: GenreEnrichmentResponse = {
      trackGenres,
      artistCache,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Genre enrichment error:', error);
    return NextResponse.json(
      { error: 'Failed to enrich tracks with genre data' },
      { status: 500 }
    );
  }
}
