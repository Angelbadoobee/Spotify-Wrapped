'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppState, ListeningEvent, EnrichedListeningEvent, ListenerProfile } from '@/types/listening';

interface ListeningDataContextValue extends AppState {
  setRawEvents: (events: ListeningEvent[]) => void;
  setEnrichedEvents: (events: EnrichedListeningEvent[]) => void;
  setProfile: (profile: ListenerProfile) => void;
  setUploadProgress: (progress: number) => void;
  setEnrichmentProgress: (progress: number, currentBatch: number, totalBatches: number) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setUploadError: (error?: string) => void;
  setEnrichmentError: (error?: string) => void;
  reset: () => void;
}

const ListeningDataContext = createContext<ListeningDataContextValue | undefined>(undefined);

const initialState: AppState = {
  rawEvents: [],
  enrichedEvents: [],
  profile: undefined,
  uploadState: {
    isUploading: false,
    progress: 0,
  },
  enrichmentState: {
    isEnriching: false,
    progress: 0,
    currentBatch: 0,
    totalBatches: 0,
  },
  isProcessing: false,
};

export function ListeningDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  
  const setRawEvents = useCallback((events: ListeningEvent[]) => {
    setState(prev => ({ ...prev, rawEvents: events }));
  }, []);
  
  const setEnrichedEvents = useCallback((events: EnrichedListeningEvent[]) => {
    setState(prev => ({ ...prev, enrichedEvents: events }));
  }, []);
  
  const setProfile = useCallback((profile: ListenerProfile) => {
    setState(prev => ({ ...prev, profile }));
  }, []);
  
  const setUploadProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      uploadState: {
        ...prev.uploadState,
        progress,
        isUploading: progress < 100,
      },
    }));
  }, []);
  
  const setEnrichmentProgress = useCallback((
    progress: number,
    currentBatch: number,
    totalBatches: number
  ) => {
    setState(prev => ({
      ...prev,
      enrichmentState: {
        ...prev.enrichmentState,
        progress,
        currentBatch,
        totalBatches,
        isEnriching: progress < 100,
      },
    }));
  }, []);
  
  const setIsProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({ ...prev, isProcessing }));
  }, []);
  
  const setUploadError = useCallback((error?: string) => {
    setState(prev => ({
      ...prev,
      uploadState: {
        ...prev.uploadState,
        error,
        isUploading: false,
      },
    }));
  }, []);
  
  const setEnrichmentError = useCallback((error?: string) => {
    setState(prev => ({
      ...prev,
      enrichmentState: {
        ...prev.enrichmentState,
        error,
        isEnriching: false,
      },
    }));
  }, []);
  
  const reset = useCallback(() => {
    setState(initialState);
  }, []);
  
  const value: ListeningDataContextValue = {
    ...state,
    setRawEvents,
    setEnrichedEvents,
    setProfile,
    setUploadProgress,
    setEnrichmentProgress,
    setIsProcessing,
    setUploadError,
    setEnrichmentError,
    reset,
  };
  
  return (
    <ListeningDataContext.Provider value={value}>
      {children}
    </ListeningDataContext.Provider>
  );
}

export function useListeningData() {
  const context = useContext(ListeningDataContext);
  if (!context) {
    throw new Error('useListeningData must be used within ListeningDataProvider');
  }
  return context;
}
