'use client';

import { useCallback, useState } from 'react';
import styles from './FileUploader.module.css';

interface FileUploaderProps {
  onFilesLoad: (contents: string[]) => void;
  isLoading?: boolean;
}

export default function FileUploader({ onFilesLoad, isLoading }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const handleFiles = useCallback((files: FileList) => {
    const jsonFiles = Array.from(files).filter(file => file.name.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      alert('Please upload JSON files');
      return;
    }
    
    if (jsonFiles.length > 10) {
      alert('Maximum 10 files allowed. First 10 will be used.');
      jsonFiles.splice(10);
    }
    
    setSelectedFiles(jsonFiles);
  }, []);
  
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    const contents: string[] = [];
    
    for (const file of selectedFiles) {
      try {
        const text = await file.text();
        contents.push(text);
      } catch (error) {
        console.error(`Error reading ${file.name}:`, error);
        alert(`Failed to read ${file.name}`);
        return;
      }
    }
    
    onFilesLoad(contents);
  }, [selectedFiles, onFilesLoad]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);
  
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''} ${isLoading ? styles.loading : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className={styles.content}>
          {isLoading ? (
            <>
              <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
              <p>Processing your listening history...</p>
            </>
          ) : (
            <>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3>Drop your Spotify data here</h3>
              <p className={styles.description}>
                Upload up to 10 JSON files from your extended streaming history
              </p>
              <label className="btn btn-primary">
                Choose Files
                <input
                  type="file"
                  accept=".json"
                  multiple
                  onChange={handleFileInput}
                  className={styles.fileInput}
                />
              </label>
            </>
          )}
        </div>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className={styles.selectedFiles}>
          <h4>{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected:</h4>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>
                <span>{file.name}</span>
                <button 
                  onClick={() => removeFile(index)}
                  className={styles.removeBtn}
                  type="button"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button 
            onClick={handleUpload}
            className="btn btn-primary"
            disabled={isLoading}
          >
            Analyze {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
      
      <div className={styles.instructions}>
        <h4>How to get your Spotify data:</h4>
        <ol>
          <li>Go to <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer">Spotify Privacy Settings</a></li>
          <li>Request your "Extended streaming history"</li>
          <li>Wait for Spotify to email you (usually takes a few days)</li>
          <li>Download and upload all the JSON files here (you can upload multiple files at once)</li>
        </ol>
      </div>
    </div>
  );
}
