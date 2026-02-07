'use client';

import { useRouter } from 'next/navigation';
import { useListeningAnalytics } from '@/hooks/useListeningAnalytics';
import { useListeningData } from '@/context/ListeningDataContext';
import FileUploader from '@/components/upload/FileUploader';
import styles from './page.module.css';

export default function UploadPage() {
  const router = useRouter();
  const { processFile, enrichWithSpotify } = useListeningAnalytics();
  const { uploadState, isProcessing } = useListeningData();
  
  const handleFilesLoad = async (contents: string[]) => {
    try {
      // Merge all JSON arrays into one
      const allEvents: any[] = [];
      
      for (const content of contents) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          allEvents.push(...parsed);
        } else {
          throw new Error('Invalid JSON format - expected an array');
        }
      }
      
      console.log(`Loaded ${allEvents.length} total events from ${contents.length} file(s)`);
      
      // Sort by timestamp
      allEvents.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
      
      // Process merged data
      const enriched = await processFile(JSON.stringify(allEvents));
      
      // Enrich with Spotify API (optional - can skip if API not configured)
      if (process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID) {
        await enrichWithSpotify(enriched);
      }
      
      // Navigate to overview
      router.push('/overview');
    } catch (error) {
      console.error('Error processing files:', error);
      alert(error instanceof Error ? error.message : 'Error processing files');
    }
  };
  
  return (
    <main className={styles.main}>
      <div className="container">
        <header className={styles.header}>
          <h1 className="text-gradient">Spotify Listening Analytics</h1>
          <p className={styles.subtitle}>
            Discover your unique listening identity through behavioral analysis
          </p>
        </header>
        
        <FileUploader
          onFilesLoad={handleFilesLoad}
          isLoading={isProcessing || uploadState.isUploading}
        />
        
        {uploadState.error && (
          <div className={styles.error}>
            <p>{uploadState.error}</p>
          </div>
        )}
        
        {uploadState.progress > 0 && uploadState.progress < 100 && (
          <div className={styles.progress}>
            <div className={styles.progressBar} style={{ width: `${uploadState.progress}%` }} />
          </div>
        )}
      </div>
    </main>
  );
}
