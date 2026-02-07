'use client';

import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import styles from './ArtistCountryMap.module.css';

interface CountryData {
  country: string;
  count: number;
  iso: string;
}

interface ArtistCountryMapProps {
  data: CountryData[];
  title?: string;
}

// Use a more reliable topology source
const geoUrl = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

export default function ArtistCountryMap({ data, title = 'Artists by Country' }: ArtistCountryMapProps) {
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    // Preload the geography data
    fetch(geoUrl)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load map');
        return response.json();
      })
      .then(() => setMapLoaded(true))
      .catch(() => setMapError(true));
  }, []);
  
  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.emptyState}>
          <p>Country data not available yet</p>
          <p className={styles.emptyHint}>
            This map shows where your favorite artists are from. Data coming soon!
          </p>
        </div>
      </div>
    );
  }
  
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  // Create color scale: cold (blue) to hot (red)
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount * 0.2, maxCount * 0.4, maxCount * 0.6, maxCount * 0.8, maxCount])
    .range([
      'rgba(59, 130, 246, 0.3)',   // Light blue (cold)
      'rgba(14, 165, 233, 0.5)',   // Cyan
      'rgba(34, 197, 94, 0.7)',    // Green
      'rgba(251, 191, 36, 0.85)',  // Yellow
      'rgba(249, 115, 22, 0.9)',   // Orange
      'rgba(239, 68, 68, 1)',      // Red (hot)
    ]);
  
  // Create country lookup map
  const countryMap = new Map<string, number>();
  data.forEach(d => {
    countryMap.set(d.iso, d.count);
  });
  
  const getCountryColor = (geo: any) => {
    const isoCode = geo.id;
    const count = countryMap.get(isoCode);
    
    if (!count) {
      return 'rgba(100, 100, 100, 0.1)'; // Gray for countries with no data
    }
    
    return colorScale(count);
  };
  
  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <p className={styles.subtitle}>Where your music comes from</p>
      
      <div className={styles.mapContainer}>
        {mapError ? (
          <div className={styles.mapError}>
            <p>Unable to load world map</p>
            <p className={styles.emptyHint}>Please check your internet connection</p>
          </div>
        ) : !mapLoaded ? (
          <div className={styles.mapLoading}>
            <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
            <p>Loading map...</p>
          </div>
        ) : (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 120,
              center: [0, 20],
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const count = countryMap.get(geo.id);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryColor(geo)}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: {
                          fill: 'rgba(255, 255, 255, 0.3)',
                          outline: 'none',
                          cursor: count ? 'pointer' : 'default',
                        },
                        pressed: { outline: 'none' },
                      }}
                    >
                      <title>
                        {geo.properties.name}
                        {count ? ` - ${count} listens` : ''}
                      </title>
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        )}
      </div>
      
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={styles.legendGradient}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}></div>
          <div style={{ backgroundColor: 'rgba(14, 165, 233, 0.5)' }}></div>
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }}></div>
          <div style={{ backgroundColor: 'rgba(251, 191, 36, 0.85)' }}></div>
          <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.9)' }}></div>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 1)' }}></div>
        </div>
        <span className={styles.legendLabel}>More</span>
      </div>
      
      {data.length > 0 && (
        <div className={styles.topCountries}>
          <h4>Top Countries</h4>
          <ul>
            {data.slice(0, 5).map((country, idx) => (
              <li key={idx}>
                <span className={styles.countryName}>{country.country}</span>
                <span className={styles.countryCount}>{country.count} listens</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
