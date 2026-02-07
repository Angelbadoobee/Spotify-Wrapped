'use client';

import styles from './ListeningHeatmap.module.css';

interface HeatmapData {
  hour: number;
  day: number;
  count: number;
}

interface ListeningHeatmapProps {
  data: HeatmapData[];
  title?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ListeningHeatmap({ data, title = 'Listening Heatmap' }: ListeningHeatmapProps) {
  // Find max count for color scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach(d => {
    dataMap.set(`${d.day}-${d.hour}`, d.count);
  });
  
  // Get color intensity based on count
  const getColor = (count: number): string => {
    if (count === 0) return 'var(--heatmap-cold)';
    
    const intensity = count / maxCount;
    
    // Cold to hot: blue → cyan → green → yellow → orange → red
    if (intensity < 0.2) return 'rgba(59, 130, 246, 0.3)'; // Light blue
    if (intensity < 0.4) return 'rgba(14, 165, 233, 0.5)'; // Cyan
    if (intensity < 0.6) return 'rgba(34, 197, 94, 0.7)'; // Green
    if (intensity < 0.8) return 'rgba(251, 191, 36, 0.85)'; // Yellow
    if (intensity < 0.9) return 'rgba(249, 115, 22, 0.9)'; // Orange
    return 'rgba(239, 68, 68, 1)'; // Red
  };
  
  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <p className={styles.subtitle}>What times do you listen most?</p>
      
      <div className={styles.heatmap}>
        {/* Hour labels (top) */}
        <div className={styles.hourLabels}>
          <div className={styles.corner}></div>
          {HOURS.filter(h => h % 3 === 0).map(hour => (
            <div key={hour} className={styles.hourLabel}>
              {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className={styles.grid}>
          {DAYS.map((day, dayIdx) => (
            <div key={day} className={styles.row}>
              <div className={styles.dayLabel}>{day}</div>
              <div className={styles.cells}>
                {HOURS.map(hour => {
                  const count = dataMap.get(`${dayIdx}-${hour}`) || 0;
                  return (
                    <div
                      key={hour}
                      className={styles.cell}
                      style={{ backgroundColor: getColor(count) }}
                      title={`${day} ${hour}:00 - ${count} plays`}
                    >
                      <span className={styles.cellValue}>{count > 0 ? count : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
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
      </div>
    </div>
  );
}
