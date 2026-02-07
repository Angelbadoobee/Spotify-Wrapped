'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListeningData } from '@/context/ListeningDataContext';
import { useListeningAnalytics } from '@/hooks/useListeningAnalytics';
import { ListenerProfile } from '@/types/listening';
import { calculateListeningHeatmap } from '@/lib/analytics/metrics';
import IdentityCard from '@/components/insights/IdentityCard';
import MetricCard from '@/components/insights/MetricCard';
import TopArtistsWithImages from '@/components/insights/TopArtistsWithImages';
import TopTracksWithAlbums from '@/components/insights/TopTracksWithAlbums';
import GenreBarChart from '@/components/charts/GenreBarChart';
import ListeningHeatmap from '@/components/charts/ListeningHeatmap';
import ArtistCountryMap from '@/components/charts/ArtistCountryMap';
import styles from './page.module.css';
import { format } from 'date-fns';

export default function OverviewPage() {
  const router = useRouter();
  const { enrichedEvents, profile: contextProfile } = useListeningData();
  const { generateProfile } = useListeningAnalytics();
  const [profile, setProfile] = useState<ListenerProfile | null>(null);
  const [heatmapData, setHeatmapData] = useState<Array<{ hour: number; day: number; count: number }>>([]);
  const [countryData, setCountryData] = useState<Array<{ country: string; count: number; iso: string }>>([]);
  const [artistImages, setArtistImages] = useState<{ [name: string]: { imageUrl: string; spotifyUrl: string } }>({});
  const [trackImages, setTrackImages] = useState<{ [key: string]: { albumArtUrl: string; spotifyUrl: string } }>({});
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  useEffect(() => {
    if (enrichedEvents.length === 0) {
      router.push('/');
      return;
    }
    
    // Generate profile if not already done
    if (!contextProfile) {
      const newProfile = generateProfile(enrichedEvents);
      setProfile(newProfile);
    } else {
      setProfile(contextProfile);
    }
    
    // Calculate heatmap data
    const heatmap = calculateListeningHeatmap(enrichedEvents);
    setHeatmapData(heatmap);
  }, [enrichedEvents, contextProfile, generateProfile, router]);
  
  // Fetch images and country data when profile is available
  useEffect(() => {
    if (!profile) return;
    
    const fetchImagesAndCountries = async () => {
      try {
        setLoadingImages(true);
        setLoadingCountries(true);
        
        // Get unique artists (up to 30 for better country coverage)
        const uniqueArtists = Array.from(
          new Set(profile.topArtists.map(a => a.name))
        ).slice(0, 30);
        
        const response = await fetch('/api/spotify/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artists: uniqueArtists,
            tracks: profile.topTracks.slice(0, 10).map(t => ({ name: t.name, artist: t.artist })),
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setArtistImages(data.artistImages || {});
          setTrackImages(data.trackImages || {});
          
          // Process country data
          const artistCountries = data.artistCountries || {};
          
          // Count listens by country across ALL events
          const countryMap = new Map<string, number>();
          
          enrichedEvents.forEach(event => {
            const artistName = event.master_metadata_album_artist_name;
            const countryInfo = artistCountries[artistName];
            
            if (countryInfo && countryInfo.iso) {
              const currentCount = countryMap.get(countryInfo.iso) || 0;
              countryMap.set(countryInfo.iso, currentCount + 1);
            }
          });
          
          // Convert to array format
          const countries = Array.from(countryMap.entries())
            .map(([iso, count]) => {
              // Find country name from artistCountries
              const countryEntry = Object.values(artistCountries).find(
                (c: any) => c.iso === iso
              );
              return {
                country: countryEntry?.country || iso,
                iso,
                count,
              };
            })
            .sort((a, b) => b.count - a.count);
          
          setCountryData(countries);
        }
      } catch (error) {
        console.error('Failed to fetch images and countries:', error);
      } finally {
        setLoadingImages(false);
        setLoadingCountries(false);
      }
    };
    
    fetchImagesAndCountries();
  }, [profile, enrichedEvents]);
  
  if (!profile) {
    return (
      <div className={styles.loading}>
        <div className="loading-spinner" style={{ width: '60px', height: '60px' }}></div>
        <p>Analyzing your listening patterns...</p>
      </div>
    );
  }
  
  const totalHours = Math.round(profile.totalListeningTime);
  const totalDays = Math.round(totalHours / 24);
  const avgPerDay = (profile.totalListens / 
    ((profile.dateRange.end.getTime() - profile.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))).toFixed(1);
  
  return (
    <main className={styles.main}>
      <div className="container">
        <header className={styles.header}>
          <h1 className="text-gradient">Your Listening Journey</h1>
          <p className={styles.dateRange}>
            {format(profile.dateRange.start, 'MMM d, yyyy')} — {format(profile.dateRange.end, 'MMM d, yyyy')}
          </p>
        </header>
        
        <section className={styles.identity}>
          <IdentityCard archetype={profile.archetype} />
        </section>
        
        <section className={styles.metrics}>
          <h2>At a Glance</h2>
          <div className={styles.metricsGrid}>
            <MetricCard
              title="Total Listens"
              value={profile.totalListens.toLocaleString()}
              subtitle={`${avgPerDay} per day`}
              color="primary"
            />
            <MetricCard
              title="Listening Time"
              value={totalDays > 0 ? `${totalDays} days` : `${totalHours} hours`}
              subtitle={`${totalHours.toLocaleString()} hours total`}
              color="secondary"
            />
            <MetricCard
              title="Active Listening"
              value={`${Math.round(profile.metrics.activeScore * 100)}%`}
              subtitle="Intentional plays"
              color="accent"
            />
            <MetricCard
              title="Unique Artists"
              value={profile.topArtists.length > 10 ? `${profile.topArtists.length}+` : profile.topArtists.length}
              subtitle={`${profile.metrics.loyaltyScore.uniqueArtistsPerWeek.toFixed(1)} per week`}
              color="warm"
            />
          </div>
        </section>
        
        <section className={styles.genres}>
          <GenreBarChart
            data={profile.metrics.genreStats.distribution}
            title="Your Genre Landscape"
          />
        </section>
        
        <section className={styles.heatmap}>
          <ListeningHeatmap
            data={heatmapData}
            title="When You Listen"
          />
        </section>
        
        <section className={styles.worldMap}>
          {loadingCountries ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--color-text-secondary)' }}>Loading artist countries...</p>
            </div>
          ) : (
            <ArtistCountryMap
              data={countryData}
              title="Musical World Tour"
            />
          )}
        </section>
        
        <section className={styles.topArtists}>
          <TopArtistsWithImages
            artists={profile.topArtists.map(a => ({
              name: a.name,
              count: a.count,
              imageUrl: artistImages[a.name]?.imageUrl,
              spotifyUrl: artistImages[a.name]?.spotifyUrl,
            }))}
            title="Your Top Artists"
          />
        </section>
        
        <section className={styles.topTracks}>
          <TopTracksWithAlbums
            tracks={profile.topTracks.map(t => {
              const trackKey = `${t.name}|||${t.artist}`;
              return {
                name: t.name,
                artist: t.artist,
                count: t.count,
                albumArtUrl: trackImages[trackKey]?.albumArtUrl,
                spotifyUrl: trackImages[trackKey]?.spotifyUrl,
              };
            })}
            title="Your Top Tracks"
          />
        </section>
        
        <section className={styles.behaviors}>
          <h2>Listening Behaviors</h2>
          <div className={styles.behaviorGrid}>
            <div className={styles.behaviorCard}>
              <h4>Shuffle Usage</h4>
              <div className={styles.percentage}>
                {Math.round(profile.metrics.shuffleRate * 100)}%
              </div>
              <div className={styles.bar}>
                <div 
                  className={styles.barFill}
                  style={{ width: `${profile.metrics.shuffleRate * 100}%` }}
                />
              </div>
            </div>
            
            <div className={styles.behaviorCard}>
              <h4>Skip Rate</h4>
              <div className={styles.percentage}>
                {Math.round(profile.metrics.skipRate * 100)}%
              </div>
              <div className={styles.bar}>
                <div 
                  className={styles.barFill}
                  style={{ width: `${profile.metrics.skipRate * 100}%` }}
                />
              </div>
            </div>
            
            <div className={styles.behaviorCard}>
              <h4>Repeat Rate</h4>
              <div className={styles.percentage}>
                {Math.round(profile.metrics.repeatMetrics.repeatRate * 100)}%
              </div>
              <div className={styles.bar}>
                <div 
                  className={styles.barFill}
                  style={{ width: `${profile.metrics.repeatMetrics.repeatRate * 100}%` }}
                />
              </div>
            </div>
            
            <div className={styles.behaviorCard}>
              <h4>Artist Loyalty</h4>
              <div className={styles.percentage}>
                {profile.metrics.loyaltyScore.loyaltyLabel}
              </div>
              <p className={styles.behaviorSubtext}>
                {Math.round(profile.metrics.loyaltyScore.topArtistPercentage * 100)}% from top 10
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
