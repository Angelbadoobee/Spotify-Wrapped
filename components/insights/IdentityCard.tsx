'use client';

import styles from './IdentityCard.module.css';
import { ListenerArchetype } from '@/types/listening';

interface IdentityCardProps {
  archetype: ListenerArchetype;
}

export default function IdentityCard({ archetype }: IdentityCardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your Listening Identity</h2>
        <div className={styles.confidenceBadge}>
          {Math.round(archetype.confidence * 100)}% match
        </div>
      </div>
      
      <div className={styles.primaryArchetype}>
        <h3 className="text-gradient">{archetype.primary}</h3>
        {archetype.secondary && (
          <p className={styles.secondary}>with hints of {archetype.secondary}</p>
        )}
      </div>
      
      <p className={styles.description}>{archetype.description}</p>
      
      <div className={styles.traits}>
        <h4>Your Traits</h4>
        <div className={styles.traitList}>
          {archetype.traits.map((trait, index) => (
            <div key={index} className={styles.trait}>
              <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{trait}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
