'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './GenreBarChart.module.css';

interface GenreData {
  genre: string;
  count: number;
  percentage: number;
}

interface GenreBarChartProps {
  data: GenreData[];
  title?: string;
}

export default function GenreBarChart({ data, title = 'Top Genres' }: GenreBarChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.emptyState}>
          <p>No genre data available yet.</p>
          <p className={styles.emptyHint}>
            Genre information will appear here once Spotify API enrichment is configured, 
            or we'll use basic genre detection based on artist names.
          </p>
        </div>
      </div>
    );
  }
  
  const chartData = data.slice(0, 10).map(item => ({
    name: item.genre.charAt(0).toUpperCase() + item.genre.slice(1),
    listens: item.count,
    percentage: (item.percentage * 100).toFixed(1),
  }));
  
  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              stroke="var(--color-text-secondary)"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: 'var(--color-text-secondary)' }}
            />
            <YAxis
              stroke="var(--color-text-secondary)"
              tick={{ fill: 'var(--color-text-secondary)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
              }}
              labelStyle={{ color: 'var(--color-text-primary)' }}
              formatter={(value: number, name: string, props: any) => {
                return [`${value} listens (${props.payload.percentage}%)`, 'Plays'];
              }}
            />
            <Bar
              dataKey="listens"
              fill="url(#colorGradient)"
              radius={[8, 8, 0, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-secondary)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
