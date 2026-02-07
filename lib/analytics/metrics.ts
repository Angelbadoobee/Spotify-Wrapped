import { EnrichedListeningEvent, RepeatMetrics, LoyaltyScore, BehavioralMetrics, GenreStats } from '@/types/listening';
import { CONFIG } from '@/lib/config';

/**
 * Calculate active listening score for an individual event
 */
export function calculateActiveScore(event: EnrichedListeningEvent): number {
  let score = event.completionRatio;
  
  if (event.skipped) {
    score -= CONFIG.ACTIVE_SCORE_SKIP_PENALTY;
  }
  
  if (event.shuffle) {
    score -= CONFIG.ACTIVE_SCORE_SHUFFLE_PENALTY;
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Analyze repeat listening patterns
 */
export function analyzeRepeatPatterns(events: EnrichedListeningEvent[]): RepeatMetrics {
  const trackCounts = new Map<string, number>();
  const trackTimestamps = new Map<string, Date[]>();
  const artistStreaks: Array<{ artist: string; length: number; startTime: Date }> = [];
  
  // Count repeats and track timestamps
  events.forEach(event => {
    const trackKey = `${event.master_metadata_track_name}|||${event.master_metadata_album_artist_name}`;
    trackCounts.set(trackKey, (trackCounts.get(trackKey) || 0) + 1);
    
    if (!trackTimestamps.has(trackKey)) {
      trackTimestamps.set(trackKey, []);
    }
    trackTimestamps.get(trackKey)!.push(event.timestamp);
  });
  
  // Find most repeated tracks
  const repeatedTracks = Array.from(trackCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([trackKey, count]) => {
      const [track, artist] = trackKey.split('|||');
      return { track, artist, count };
    });
  
  // Calculate repeat rate
  const totalRepeats = Array.from(trackCounts.values()).filter(count => count > 1).length;
  const repeatRate = totalRepeats / trackCounts.size;
  
  // Calculate average time between repeats
  let totalTimeBetween = 0;
  let repeatPairs = 0;
  
  trackTimestamps.forEach(timestamps => {
    if (timestamps.length > 1) {
      for (let i = 1; i < timestamps.length; i++) {
        const diff = timestamps[i].getTime() - timestamps[i - 1].getTime();
        totalTimeBetween += diff;
        repeatPairs++;
      }
    }
  });
  
  const averageTimeBetweenRepeats = repeatPairs > 0 
    ? totalTimeBetween / repeatPairs / (1000 * 60 * 60) // Convert to hours
    : 0;
  
  // Find artist streaks
  let currentArtist = '';
  let currentStreak = 0;
  let streakStart: Date | null = null;
  
  events.forEach(event => {
    if (event.master_metadata_album_artist_name === currentArtist) {
      currentStreak++;
    } else {
      if (currentStreak >= 3) {
        artistStreaks.push({
          artist: currentArtist,
          length: currentStreak,
          startTime: streakStart!,
        });
      }
      currentArtist = event.master_metadata_album_artist_name;
      currentStreak = 1;
      streakStart = event.timestamp;
    }
  });
  
  // Don't forget the last streak
  if (currentStreak >= 3) {
    artistStreaks.push({
      artist: currentArtist,
      length: currentStreak,
      startTime: streakStart!,
    });
  }
  
  return {
    totalRepeats,
    repeatRate,
    mostRepeatedTracks: repeatedTracks,
    averageTimeBetweenRepeats,
    sameArtistStreaks: artistStreaks.sort((a, b) => b.length - a.length).slice(0, 10),
  };
}

/**
 * Calculate artist loyalty and exploration metrics
 */
export function calculateArtistLoyalty(events: EnrichedListeningEvent[]): LoyaltyScore {
  const artistCounts = new Map<string, number>();
  
  // Count listens per artist
  events.forEach(event => {
    const artist = event.master_metadata_album_artist_name;
    artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
  });
  
  const sortedArtists = Array.from(artistCounts.entries())
    .sort((a, b) => b[1] - a[1]);
  
  // Top 10 artists percentage
  const top10Count = sortedArtists.slice(0, 10).reduce((sum, [_, count]) => sum + count, 0);
  const topArtistPercentage = top10Count / events.length;
  
  // Calculate Gini coefficient (inequality measure)
  const giniCoefficient = calculateGini(Array.from(artistCounts.values()));
  
  // Calculate unique artists per week
  const dateRange = events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime();
  const weeks = dateRange / (1000 * 60 * 60 * 24 * 7);
  const uniqueArtistsPerWeek = artistCounts.size / Math.max(weeks, 1);
  
  // Exploration score (inverse of concentration)
  const explorationScore = 1 - giniCoefficient;
  
  // Determine label
  let loyaltyLabel: 'Highly Loyal' | 'Balanced' | 'Explorer';
  if (topArtistPercentage > CONFIG.LOYALTY.HIGH_TOP_ARTIST_THRESHOLD) {
    loyaltyLabel = 'Highly Loyal';
  } else if (explorationScore > (1 - CONFIG.LOYALTY.LOW_EXPLORATION_THRESHOLD)) {
    loyaltyLabel = 'Explorer';
  } else {
    loyaltyLabel = 'Balanced';
  }
  
  return {
    topArtistPercentage,
    uniqueArtistsPerWeek,
    giniCoefficient,
    explorationScore,
    loyaltyLabel,
  };
}

/**
 * Calculate Gini coefficient for inequality measurement
 */
function calculateGini(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  if (sum === 0) return 0;
  
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sorted[i];
  }
  
  return numerator / (n * sum);
}

/**
 * Calculate genre statistics and distribution
 */
export function calculateGenreDistribution(events: EnrichedListeningEvent[]): GenreStats {
  const genreCounts = new Map<string, number>();
  const genreByHour = new Map<number, Map<string, number>>();
  const genreByDate = new Map<string, Map<string, number>>();
  
  // Count genres and organize by time
  events.forEach(event => {
    // Use enriched genres if available, otherwise use fallback genre detection
    const genres = event.artistGenres.length > 0 
      ? event.artistGenres 
      : getFallbackGenres(event.master_metadata_album_artist_name);
    
    genres.forEach(genre => {
      // Normalize genre
      const normalizedGenre = normalizeGenre(genre);
      genreCounts.set(normalizedGenre, (genreCounts.get(normalizedGenre) || 0) + 1);
      
      // By hour
      const hour = event.timestamp.getHours();
      if (!genreByHour.has(hour)) {
        genreByHour.set(hour, new Map());
      }
      const hourMap = genreByHour.get(hour)!;
      hourMap.set(normalizedGenre, (hourMap.get(normalizedGenre) || 0) + 1);
      
      // By date (for evolution)
      const dateKey = event.timestamp.toISOString().split('T')[0];
      if (!genreByDate.has(dateKey)) {
        genreByDate.set(dateKey, new Map());
      }
      const dateMap = genreByDate.get(dateKey)!;
      dateMap.set(normalizedGenre, (dateMap.get(normalizedGenre) || 0) + 1);
    });
  });
  
  // If no genres were found at all, return empty stats
  if (genreCounts.size === 0) {
    return {
      distribution: [],
      topGenres: [],
      genreDiversity: 0,
      genreEvolution: [],
      genreByTimeOfDay: {},
    };
  }
  
  // Create distribution
  const totalListens = events.length;
  const distribution = Array.from(genreCounts.entries())
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: count / totalListens,
    }))
    .sort((a, b) => b.count - a.count);
  
  // Calculate Shannon entropy for diversity
  const genreDiversity = calculateShannonEntropy(
    Array.from(genreCounts.values()),
    totalListens
  );
  
  // Genre evolution over time
  const genreEvolution = Array.from(genreByDate.entries())
    .map(([date, genres]) => ({
      date: new Date(date),
      genres: Object.fromEntries(genres),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Genre by time of day
  const genreByTimeOfDay: { [hour: number]: { [genre: string]: number } } = {};
  genreByHour.forEach((genres, hour) => {
    genreByTimeOfDay[hour] = Object.fromEntries(genres);
  });
  
  return {
    distribution,
    topGenres: distribution.slice(0, 10).map(g => g.genre),
    genreDiversity,
    genreEvolution,
    genreByTimeOfDay,
  };
}

/**
 * Fallback genre detection based on artist name patterns
 * Used when Spotify API enrichment is not available
 */
function getFallbackGenres(artistName: string): string[] {
  const name = artistName.toLowerCase();
  const genres: string[] = [];
  
  // Latin/Spanish artists
  const latinArtists = ['bad bunny', 'marc anthony', 'daddy yankee', 'j balvin', 'karol g', 
                        'ozuna', 'nicky jam', 'maluma', 'anuel aa', 'rauw alejandro', 
                        'becky g', 'feid', 'young miko', 'tokischa', 'coi leray', 'nicki nicole', 
                        'lyanno', 'hozwal', 'kaliii', 'kenzo b'];
  
  if (latinArtists.some(artist => name.includes(artist))) {
    genres.push('Latin');
    return genres;
  }
  
  // Classic/Oldies
  const classicArtists = ['jackson 5', 'michael jackson', 'marvin gaye', 'stevie wonder', 
                          'whitney houston', 'elvis presley'];
  
  if (classicArtists.some(artist => name.includes(artist))) {
    genres.push('Soul');
    return genres;
  }
  
  // Default to 'Unknown' if no match
  genres.push('Various');
  return genres;
}

/**
 * Normalize genre names to broader categories
 */
function normalizeGenre(genre: string): string {
  const lowerGenre = genre.toLowerCase();
  
  for (const [category, variants] of Object.entries(CONFIG.GENRE_MAPPING)) {
    if (variants.some(v => lowerGenre.includes(v))) {
      return category;
    }
  }
  
  return genre;
}

/**
 * Calculate Shannon entropy for diversity measurement
 */
function calculateShannonEntropy(counts: number[], total: number): number {
  let entropy = 0;
  
  for (const count of counts) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

/**
 * Calculate all behavioral metrics
 */
export function calculateBehavioralMetrics(events: EnrichedListeningEvent[]): BehavioralMetrics {
  // Overall active score
  const activeScore = events.reduce((sum, e) => sum + calculateActiveScore(e), 0) / events.length;
  
  // Shuffle and skip rates
  const shuffleRate = events.filter(e => e.shuffle).length / events.length;
  const skipRate = events.filter(e => e.skipped).length / events.length;
  
  // Average completion ratio
  const averageCompletionRatio = events.reduce((sum, e) => sum + e.completionRatio, 0) / events.length;
  
  // Session length (we'll need sessions for this, using placeholder)
  const averageSessionLength = 45; // Will be calculated from actual sessions
  
  return {
    activeScore,
    shuffleRate,
    skipRate,
    averageCompletionRatio,
    averageSessionLength,
    repeatMetrics: analyzeRepeatPatterns(events),
    loyaltyScore: calculateArtistLoyalty(events),
    genreStats: calculateGenreDistribution(events),
  };
}

/**
 * Calculate listening heatmap data (hour x day of week)
 */
export function calculateListeningHeatmap(events: EnrichedListeningEvent[]): Array<{ hour: number; day: number; count: number }> {
  const heatmapData = new Map<string, number>();
  
  events.forEach(event => {
    const hour = event.timestamp.getHours();
    const day = event.timestamp.getDay(); // 0 = Sunday, 6 = Saturday
    const key = `${day}-${hour}`;
    
    heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
  });
  
  return Array.from(heatmapData.entries()).map(([key, count]) => {
    const [day, hour] = key.split('-').map(Number);
    return { hour, day, count };
  });
}

/**
 * Calculate country distribution based on artist origins
 * This is a fallback - ideally would come from Spotify API
 */
export function calculateCountryDistribution(events: EnrichedListeningEvent[]): Array<{ country: string; count: number; iso: string }> {
  const countryMap = new Map<string, number>();
  
  // Country mapping for common artists - using numeric ISO codes that match world-atlas
  const artistCountries: { [key: string]: { country: string; iso: string } } = {
    // Puerto Rico (630)
    'bad bunny': { country: 'Puerto Rico', iso: '630' },
    'daddy yankee': { country: 'Puerto Rico', iso: '630' },
    'rauw alejandro': { country: 'Puerto Rico', iso: '630' },
    'lyanno': { country: 'Puerto Rico', iso: '630' },
    // Colombia (170)
    'j balvin': { country: 'Colombia', iso: '170' },
    'karol g': { country: 'Colombia', iso: '170' },
    'maluma': { country: 'Colombia', iso: '170' },
    'feid': { country: 'Colombia', iso: '170' },
    'kaliii': { country: 'Colombia', iso: '170' },
    // USA (840)
    'marc anthony': { country: 'United States', iso: '840' },
    'coi leray': { country: 'United States', iso: '840' },
    'jackson 5': { country: 'United States', iso: '840' },
    'michael jackson': { country: 'United States', iso: '840' },
    'whitney houston': { country: 'United States', iso: '840' },
    'marvin gaye': { country: 'United States', iso: '840' },
    'stevie wonder': { country: 'United States', iso: '840' },
    'elvis presley': { country: 'United States', iso: '840' },
    'beyoncé': { country: 'United States', iso: '840' },
    'eminem': { country: 'United States', iso: '840' },
    'imdontai': { country: 'United States', iso: '840' },
    'cordae': { country: 'United States', iso: '840' },
    'snow tha product': { country: 'United States', iso: '840' },
    'crypt': { country: 'United States', iso: '840' },
    // Dominican Republic (214)
    'tokischa': { country: 'Dominican Republic', iso: '214' },
    // Argentina (032)
    'nicki nicole': { country: 'Argentina', iso: '032' },
    'young miko': { country: 'Argentina', iso: '032' },
    // Spain (724)
    'ozuna': { country: 'Spain', iso: '724' },
    // Mexico (484)
    'becky g': { country: 'Mexico', iso: '484' },
    // Jamaica (388)
    'jason mraz': { country: 'Jamaica', iso: '388' },
    // Panama (591)
    'anuel aa': { country: 'Panama', iso: '591' },
    'nicky jam': { country: 'Panama', iso: '591' },
  };
  
  events.forEach(event => {
    const artistLower = event.master_metadata_album_artist_name.toLowerCase();
    const countryData = artistCountries[artistLower];
    
    if (countryData) {
      const key = countryData.iso;
      countryMap.set(key, (countryMap.get(key) || 0) + 1);
    }
  });
  
  // Convert to array and sort
  const countryArray = Array.from(countryMap.entries()).map(([iso, count]) => {
    // Find the full country name
    const countryEntry = Object.values(artistCountries).find(c => c.iso === iso);
    return {
      country: countryEntry?.country || iso,
      iso,
      count,
    };
  });
  
  return countryArray.sort((a, b) => b.count - a.count);
}
