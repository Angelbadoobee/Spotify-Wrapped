'use client';

import styles from './MetricCard.module.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'warm';
}

export default function MetricCard({ title, value, subtitle, icon, color = 'primary' }: MetricCardProps) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        <div className={styles.value}>{value}</div>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}
