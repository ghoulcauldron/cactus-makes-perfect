import React from 'react';
import { motion } from 'framer-motion';
import styles from './MothershipHUD.module.css';
import { PatternScramble, type PatternScrambleHandle } from './PatternScramble';
import { CYBERPUNK_THEME } from '../../constants/themes';

interface HUDProps {
  progress: number;
  onNavigate: (section: string) => void;
}

export const MothershipHUD: React.FC<HUDProps> = ({ progress, onNavigate }) => {

  const [isPositioned, setIsPositioned] = React.useState(false);
  
  // Refs to control the scramble of each nav item
  const mapRef = React.useRef<any>(null);
  const logsRef = React.useRef<any>(null);
  const brainRef = React.useRef<any>(null);

  return (
    <motion.div 
      className={styles.hudContainer}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      onAnimationComplete={() => setIsPositioned(true)} // Trigger scramble after initial animation
    >
      <div className={styles.glassBase}>
        <div className={styles.navGroup}>
          <button className={styles.navItem} onClick={() => onNavigate('map')} onMouseEnter={() => mapRef.current?.triggerHover()}>
            <div className={styles.iconSlot}>
              {/* Abstract Grid Icon */}
              <svg viewBox="0 0 24 24" className={styles.iconSvg}>
                <path d="M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zm-11 0h7v7H3z" fill="currentColor" />
              </svg>
            </div>
          <PatternScramble ref={mapRef} text="MAP" {...CYBERPUNK_THEME} startTrigger={isPositioned} speed={0.6} />
          </button>

          <button className={styles.navItem} onClick={() => onNavigate('itinerary')} onMouseEnter={() => logsRef.current?.triggerHover()}>
            <div className={styles.iconSlot}>
              {/* Crystal/Stop Icon */}
              <svg viewBox="0 0 24 24" className={styles.iconSvg}>
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor" />
              </svg>
              {/* Progress Indicator */}
              <motion.div 
                className={styles.progressRing} 
                style={{ scaleY: progress }} 
              />
            </div>
            <PatternScramble ref={logsRef} text="LOGS" {...CYBERPUNK_THEME} startTrigger={isPositioned} speed={0.6} />
          </button>

          <button className={styles.navItem} onClick={() => onNavigate('brain')} onMouseEnter={() => brainRef.current?.triggerHover()}>
            <div className={styles.iconSlot}>
              {/* Brain Icon */}
              <svg viewBox="0 0 24 24" className={styles.iconSvg}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" fill="currentColor" />
              </svg>
            </div>  
            <PatternScramble ref={brainRef} text="BRAIN" {...CYBERPUNK_THEME} startTrigger={isPositioned} speed={0.6} />          
            </button>
        </div>
      </div>
    </motion.div>
  );
};