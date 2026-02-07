'use client';

import { useState } from 'react';
import styles from './TopArtistsWithImages.module.css';

interface Artist {
  name: string;
  count: number;
  imageUrl?: string;
  spotifyUrl?: string;
}

interface TopArtistsWithImagesProps {
  artists: Artist[];
  title?: string;
}

export default function TopArtistsWithImages({ artists, title = 'Top Artists' }: TopArtistsWithImagesProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };
  
  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      
      <div className={styles.grid}>
        {artists.slice(0, 10).map((artist, index) => (
          <div key={index} className={styles.artistCard}>
            <div className={styles.rank}>{index + 1}</div>
            
            <div className={styles.imageWrapper}>
              {artist.imageUrl && !imageErrors.has(index) ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className={styles.artistImage}
                  onError={() => handleImageError(index)}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            
            <div className={styles.artistInfo}>
              <div className={styles.artistName}>{artist.name}</div>
              <div className={styles.playCount}>{artist.count} plays</div>
            </div>
            
            {artist.spotifyUrl && (
              <a 
                href={artist.spotifyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.spotifyLink}
                title="Open in Spotify"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
