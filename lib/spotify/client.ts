import { CONFIG } from '@/lib/config';
import { SpotifyAuthResponse, SpotifyTrack, SpotifyArtist } from '@/types/listening';

/**
 * Spotify API Client
 */
export class SpotifyClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  /**
   * Get or refresh access token
   */
  async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    
    // Request new token
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }
    
    const response = await fetch(CONFIG.SPOTIFY_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get Spotify access token: ${response.statusText}`);
    }
    
    const data: SpotifyAuthResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer
    
    return this.accessToken;
  }
  
  /**
   * Fetch track details including duration and artist IDs
   */
  async getTracks(trackIds: string[]): Promise<Map<string, SpotifyTrack>> {
    const token = await this.getAccessToken();
    const trackMap = new Map<string, SpotifyTrack>();
    
    // Batch fetch tracks (50 at a time)
    const batches = this.createBatches(trackIds, CONFIG.BATCH_SIZE);
    
    for (const batch of batches) {
      await this.withRetry(async () => {
        const ids = batch.join(',');
        const response = await fetch(
          `${CONFIG.SPOTIFY_API_BASE}/tracks?ids=${ids}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Spotify API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.tracks) {
          data.tracks.forEach((track: SpotifyTrack | null) => {
            if (track) {
              trackMap.set(track.id, track);
            }
          });
        }
      });
    }
    
    return trackMap;
  }
  
  /**
   * Fetch artist details including genres
   */
  async getArtists(artistIds: string[]): Promise<Map<string, SpotifyArtist>> {
    const token = await this.getAccessToken();
    const artistMap = new Map<string, SpotifyArtist>();
    
    // Remove duplicates
    const uniqueIds = Array.from(new Set(artistIds));
    
    // Batch fetch artists (50 at a time)
    const batches = this.createBatches(uniqueIds, CONFIG.BATCH_SIZE);
    
    for (const batch of batches) {
      await this.withRetry(async () => {
        const ids = batch.join(',');
        const response = await fetch(
          `${CONFIG.SPOTIFY_API_BASE}/artists?ids=${ids}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Spotify API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.artists) {
          data.artists.forEach((artist: SpotifyArtist | null) => {
            if (artist) {
              artistMap.set(artist.id, artist);
            }
          });
        }
      });
    }
    
    return artistMap;
  }
  
  /**
   * Create batches from an array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries = CONFIG.MAX_RETRIES
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await this.delay(CONFIG.RETRY_DELAY_MS * (CONFIG.MAX_RETRIES - retries + 1));
        return this.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let spotifyClient: SpotifyClient | null = null;

export function getSpotifyClient(): SpotifyClient {
  if (!spotifyClient) {
    spotifyClient = new SpotifyClient();
  }
  return spotifyClient;
}
