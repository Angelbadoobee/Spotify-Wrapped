import { BehavioralMetrics, ListenerArchetype } from '@/types/listening';
import { CONFIG, ArchetypeKey } from '@/lib/config';

/**
 * Classify listener into archetypes based on behavioral metrics
 */
export function classifyListener(metrics: BehavioralMetrics): ListenerArchetype {
  const scores = new Map<ArchetypeKey, number>();
  
  // Calculate score for each archetype
  scores.set('COMFORT_LISTENER', scoreComfortListener(metrics));
  scores.set('EXPLORER', scoreExplorer(metrics));
  scores.set('GENRE_HOPPER', scoreGenreHopper(metrics));
  scores.set('LOYAL_FAN', scoreLoyalFan(metrics));
  scores.set('OBSESSIVE_REPEATER', scoreObsessiveRepeater(metrics));
  scores.set('PASSIVE_LISTENER', scorePassiveListener(metrics));
  scores.set('ACTIVE_CURATOR', scoreActiveCurator(metrics));
  
  // Sort by score
  const sortedScores = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const primaryKey = sortedScores[0][0];
  const secondaryKey = sortedScores[1][0];
  const primaryScore = sortedScores[0][1];
  const secondaryScore = sortedScores[1][1];
  
  const primary = CONFIG.ARCHETYPES[primaryKey];
  const secondary = secondaryScore > 0.3 ? CONFIG.ARCHETYPES[secondaryKey] : undefined;
  
  return {
    primary: primary.name,
    secondary: secondary?.name,
    confidence: primaryScore,
    traits: [
      ...primary.traits,
      ...(secondary ? secondary.traits.slice(0, 1) : []),
    ],
    description: primary.description,
  };
}

/**
 * Score: Comfort Listener
 * High repeat rate, low exploration
 */
function scoreComfortListener(metrics: BehavioralMetrics): number {
  let score = 0;
  
  // High repeat rate
  if (metrics.repeatMetrics.repeatRate > 0.6) {
    score += 0.4;
  } else if (metrics.repeatMetrics.repeatRate > 0.4) {
    score += 0.2;
  }
  
  // Low exploration
  if (metrics.loyaltyScore.explorationScore < 0.4) {
    score += 0.3;
  }
  
  // Moderate active listening
  if (metrics.activeScore > 0.5 && metrics.activeScore < 0.8) {
    score += 0.2;
  }
  
  // Artist loyalty
  if (metrics.loyaltyScore.topArtistPercentage > 0.4) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

/**
 * Score: Explorer
 * High artist diversity, low repeat rate
 */
function scoreExplorer(metrics: BehavioralMetrics): number {
  let score = 0;
  
  // High exploration
  if (metrics.loyaltyScore.explorationScore > 0.7) {
    score += 0.4;
  } else if (metrics.loyaltyScore.explorationScore > 0.5) {
    score += 0.2;
  }
  
  // Low repeat rate
  if (metrics.repeatMetrics.repeatRate < 0.3) {
    score += 0.3;
  }
  
  // High unique artists per week
  if (metrics.loyaltyScore.uniqueArtistsPerWeek > 20) {
    score += 0.2;
  }
  
  // Genre diversity
  if (metrics.genreStats.genreDiversity > 3) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

/**
 * Score: Genre Hopper
 * High genre diversity, varied listening patterns
 */
function scoreGenreHopper(metrics: BehavioralMetrics): number {
  let score = 0;
  
  // High genre diversity
  if (metrics.genreStats.genreDiversity > 3.5) {
    score += 0.5;
  } else if (metrics.genreStats.genreDiversity > 2.5) {
    score += 0.3;
  }
  
  // Multiple top genres (not dominated by one)
  const topGenrePercentage = metrics.genreStats.distribution[0]?.percentage || 0;
  if (topGenrePercentage < 0.4) {
    score += 0.3;
  }
  
  // Moderate exploration
  if (metrics.loyaltyScore.explorationScore > 0.4 && metrics.loyaltyScore.explorationScore < 0.7) {
    score += 0.2;
  }
  
  return Math.min(score, 1);
}

/**
 * Score: Loyal Fan
 * Artist loyalty, deep catalog exploration
 */
function scoreLoyalFan(metrics: BehavioralMetrics): number {
  let score = 0;
  
  // High top artist percentage
  if (metrics.loyaltyScore.topArtistPercentage > 0.6) {
    score += 0.5;
  } else if (metrics.loyaltyScore.topArtistPercentage > 0.4) {
    score += 0.3;
  }
  
  // Artist streaks
  if (metrics.repeatMetrics.sameArtistStreaks.length > 5) {
    score += 0.3;
  }
  
  // Active listening (intentional)
  if (metrics.activeScore > 0.7) {
    score += 0.2;
  }
  
  return Math.min(score, 1);
}

/**
 * Score: Obsessive Repeater
 * Extreme repeat behavior on specific tracks
 */
function scoreObsessiveRepeater(metrics: BehavioralMetrics): number {
  let score = 0;
  
  // Very high repeat rate
  if (metrics.repeatMetrics.repeatRate > 0.7) {
    score += 0.5;
  }
  
  // Check for extreme repeats on individual tracks
  const topRepeatedCount = metrics.repeatMetrics.mostRepeatedTracks[0]?.count || 0;
  if (topRepeatedCount > 50) {
    score += 0.4;
  } else if (topRepeatedCount > 30) {
    score += 0.2;
  }
  
  // Short time between repeats
  if (metrics.repeatMetrics.averageTimeBetweenRepeats < 24) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

/**
 * Score: Passive Listener
 * High shuffle, high skip rate, background listening
 */
function scorePassiveListener(metrics: BehavioralMetrics): number {
  let score = 0;
  
  // High shuffle rate
  if (metrics.shuffleRate > 0.7) {
    score += 0.3;
  } else if (metrics.shuffleRate > 0.5) {
    score += 0.15;
  }
  
  // High skip rate
  if (metrics.skipRate > 0.4) {
    score += 0.3;
  } else if (metrics.skipRate > 0.25) {
    score += 0.15;
  }
  
  // Low active score
  if (metrics.activeScore < 0.5) {
    score += 0.3;
  }
  
  // Low completion ratio
  if (metrics.averageCompletionRatio < 0.7) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

/**
 * Score: Active Curator
 * Low shuffle, low skip, intentional listening
 */
function scoreActiveCurator(metrics: BehavioralMetrics): number {
  let score = 0;
  
  // Low shuffle rate
  if (metrics.shuffleRate < 0.3) {
    score += 0.3;
  }
  
  // Low skip rate
  if (metrics.skipRate < 0.2) {
    score += 0.3;
  }
  
  // High active score
  if (metrics.activeScore > 0.8) {
    score += 0.3;
  }
  
  // High completion ratio
  if (metrics.averageCompletionRatio > 0.85) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}
