'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import styles from './page.module.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const THREE_HOURS = 3 * 60 * 60;

export default function TimerPage() {
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(THREE_HOURS);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Bonus timer state
  const [bonusSecondsLeft, setBonusSecondsLeft] = useState(THREE_HOURS);
  const [bonusRunning, setBonusRunning] = useState(false);
  const [bonusCompleted, setBonusCompleted] = useState(false);
  const [showBonusCelebration, setShowBonusCelebration] = useState(false);
  const [bonusUnlocked, setBonusUnlocked] = useState(false);

  // Turbo timer state
  const [turboSecondsLeft, setTurboSecondsLeft] = useState(THREE_HOURS);
  const [turboRunning, setTurboRunning] = useState(false);
  const [turboCompleted, setTurboCompleted] = useState(false);
  const [showTurboCelebration, setShowTurboCelebration] = useState(false);
  const [stats, setStats] = useState(null);
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline();
      
      tl.fromTo(`.${styles.header}`, 
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      )
      .fromTo(`.${styles.timerBlock}`, 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }, 
        "-=0.4"
      )
      .fromTo(`.${styles.sessionsCard}`, 
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }, 
        "-=0.3"
      );
    }
  }, { dependencies: [loading], scope: containerRef });
  const [todaySessions, setTodaySessions] = useState([]);
  const [logging, setLogging] = useState(false);
  const intervalRef = useRef(null);
  const bonusIntervalRef = useRef(null);
  const turboIntervalRef = useRef(null);

  // Load timer state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timerStateV2');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);

        // Restore main timer
        if (state.isCompleted) {
          setIsCompleted(true);
          setSecondsLeft(0);
          setBonusUnlocked(true);
        } else if (state.isRunning && state.secondsLeft - elapsed > 0) {
          setSecondsLeft(state.secondsLeft - elapsed);
          setIsRunning(true);
        } else if (!state.isRunning && state.secondsLeft > 0) {
          setSecondsLeft(state.secondsLeft);
        }

        // Restore bonus timer
        if (state.bonusCompleted) {
          setBonusCompleted(true);
          setBonusSecondsLeft(0);
          setBonusUnlocked(true);
        } else if (state.bonusRunning && state.bonusSecondsLeft - elapsed > 0) {
          setBonusSecondsLeft(state.bonusSecondsLeft - elapsed);
          setBonusRunning(true);
          setBonusUnlocked(true);
        } else if (state.bonusUnlocked && state.bonusSecondsLeft > 0) {
          setBonusSecondsLeft(state.bonusSecondsLeft);
          setBonusUnlocked(true);
        }

        // Restore turbo timer
        if (state.turboCompleted) {
          setTurboCompleted(true);
          setTurboSecondsLeft(0);
        } else if (state.turboRunning && state.turboSecondsLeft - elapsed > 0) {
          setTurboSecondsLeft(state.turboSecondsLeft - elapsed);
          setTurboRunning(true);
        } else if (state.bonusUnlocked && state.turboSecondsLeft > 0) {
          setTurboSecondsLeft(state.turboSecondsLeft);
        }
      } catch (e) { /* ignore */ }
    }
    fetchTodaySessions();
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('timerStateV2', JSON.stringify({
      secondsLeft, isRunning, isCompleted,
      bonusSecondsLeft, bonusRunning, bonusCompleted, bonusUnlocked,
      turboSecondsLeft, turboRunning, turboCompleted,
      savedAt: Date.now(),
    }));
  }, [secondsLeft, isRunning, isCompleted, bonusSecondsLeft, bonusRunning, bonusCompleted, bonusUnlocked, turboSecondsLeft, turboRunning, turboCompleted]);

  // Main timer interval
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsCompleted(true);
            setBonusUnlocked(true);
            setShowCelebration(true);
            logSession(false, false);
            setTimeout(() => setShowCelebration(false), 4000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Bonus timer interval
  useEffect(() => {
    if (bonusRunning && bonusSecondsLeft > 0) {
      bonusIntervalRef.current = setInterval(() => {
        setBonusSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(bonusIntervalRef.current);
            setBonusRunning(false);
            setBonusCompleted(true);
            setShowBonusCelebration(true);
            logSession(true, false);
            setTimeout(() => setShowBonusCelebration(false), 4000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(bonusIntervalRef.current);
  }, [bonusRunning]);

  // Turbo timer interval
  useEffect(() => {
    if (turboRunning && turboSecondsLeft > 0) {
      turboIntervalRef.current = setInterval(() => {
        setTurboSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(turboIntervalRef.current);
            setTurboRunning(false);
            setTurboCompleted(true);
            setShowTurboCelebration(true);
            logSession(false, true);
            setTimeout(() => setShowTurboCelebration(false), 4000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(turboIntervalRef.current);
  }, [turboRunning]);

  const fetchTodaySessions = async () => {
    try {
      const res = await fetch('/api/study');
      if (res.ok) {
        const data = await res.json();
        const today = new Date().toISOString().split('T')[0];
        const todayOnly = data.sessions.filter((s) => s.date === today);
        setTodaySessions(todayOnly);
      }
    } catch (e) { /* ignore */ }
  };

  const logSession = async (isDouble, isTurbo) => {
    setLogging(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          duration_seconds: THREE_HOURS,
          is_double_credit: isDouble,
          is_turbo_credit: isTurbo,
        }),
      });
      fetchTodaySessions();
    } catch (e) {
      console.error('Failed to log session:', e);
    } finally {
      setLogging(false);
    }
  };

  // Main timer controls
  const handleStart = () => setIsRunning(true);
  const handlePause = () => { setIsRunning(false); clearInterval(intervalRef.current); };
  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setBonusUnlocked(false);
    setBonusRunning(false);
    setBonusCompleted(false);
    setTurboRunning(false);
    setTurboCompleted(false);
    clearInterval(intervalRef.current);
    clearInterval(bonusIntervalRef.current);
    clearInterval(turboIntervalRef.current);
    setSecondsLeft(THREE_HOURS);
    setBonusSecondsLeft(THREE_HOURS);
    setTurboSecondsLeft(THREE_HOURS);
    localStorage.removeItem('timerStateV2');
  };

  // Bonus timer controls
  const handleBonusStart = () => setBonusRunning(true);
  const handleBonusPause = () => { setBonusRunning(false); clearInterval(bonusIntervalRef.current); };

  // Turbo timer controls
  const handleTurboStart = () => setTurboRunning(true);
  const handleTurboPause = () => { setTurboRunning(false); clearInterval(turboIntervalRef.current); };

  // Format time
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Ring calculations
  const ringRadius = 130;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const mainProgress = ((THREE_HOURS - secondsLeft) / THREE_HOURS) * 100;
  const mainOffset = ringCircumference - (mainProgress / 100) * ringCircumference;
  const mainTimeRatio = secondsLeft / THREE_HOURS;
  let mainColor = '#10b981';
  if (mainTimeRatio < 0.17) mainColor = '#f43f5e';
  else if (mainTimeRatio < 0.33) mainColor = '#f59e0b';

  const bonusProgress = ((THREE_HOURS - bonusSecondsLeft) / THREE_HOURS) * 100;
  const bonusOffset = ringCircumference - (bonusProgress / 100) * ringCircumference;

  const turboProgress = ((THREE_HOURS - turboSecondsLeft) / THREE_HOURS) * 100;
  const turboOffset = ringCircumference - (turboProgress / 100) * ringCircumference;

  return (
    <ProtectedLayout activePage="timer">
      <div className={styles.page} ref={containerRef}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className="gradient-text">Study Timer</span>
          </h1>
          <p className={styles.subtitle}>Complete 3 hours mandatory • Bonus 3 hours to recover a life</p>
        </div>

        <div className={styles.timersRow}>
          {/* ─── Main 3-Hour Timer ─── */}
          <div className={`glass-card ${styles.timerBlock}`}>
            <h3 className={styles.timerLabel}>
              ⏱️ Mandatory Session
              {isCompleted && <span className={styles.badge}>✅ Done</span>}
            </h3>
            <div className={styles.timerWrapper}>
              {showCelebration && (
                <>
                  <div className={styles.burst1} />
                  <div className={styles.burst2} />
                </>
              )}
              <svg className={styles.timerRing} viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                <circle
                  cx="150" cy="150" r={ringRadius} fill="none"
                  stroke={isCompleted ? '#10b981' : mainColor}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={mainOffset}
                  className={styles.timerRingProgress}
                  style={{ filter: `drop-shadow(0 0 8px ${mainColor}40)` }}
                />
              </svg>
              <div className={styles.timerDisplay}>
                <span className={styles.time} style={{ color: isCompleted ? '#10b981' : undefined }}>
                  {formatTime(secondsLeft)}
                </span>
                {isCompleted && <span className={styles.completedLabel}>Session Complete!</span>}
              </div>
            </div>
            <div className={styles.controls}>
              {!isRunning && !isCompleted && (
                <button onClick={handleStart} className={`btn-primary ${styles.ctrlBtn}`}>
                  ▶ {secondsLeft < THREE_HOURS ? 'Resume' : 'Start'}
                </button>
              )}
              {isRunning && (
                <button onClick={handlePause} className={`btn-secondary ${styles.ctrlBtn}`}>
                  ⏸ Pause
                </button>
              )}
              <button onClick={handleReset} className={`btn-secondary ${styles.ctrlBtn}`}>
                🔄 Reset All
              </button>
            </div>
          </div>

          {/* ─── Bonus 3-Hour Timer ─── */}
          <div className={`glass-card ${styles.timerBlock} ${!bonusUnlocked ? styles.locked : ''}`}>
            <h3 className={styles.timerLabel}>
              ⭐ Bonus Session
              {!bonusUnlocked && <span className={styles.badgeLocked}>🔒 Complete mandatory first</span>}
              {bonusCompleted && <span className={styles.badgeGold}>⭐ +1 Life Recovered!</span>}
            </h3>
            <div className={styles.timerWrapper}>
              {showBonusCelebration && (
                <>
                  <div className={styles.burst1Gold} />
                  <div className={styles.burst2Gold} />
                </>
              )}
              <svg className={styles.timerRing} viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                <circle
                  cx="150" cy="150" r={ringRadius} fill="none"
                  stroke={bonusCompleted ? '#fbbf24' : '#f59e0b'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={bonusOffset}
                  className={styles.timerRingProgress}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.3))' }}
                />
              </svg>
              <div className={styles.timerDisplay}>
                <span className={styles.time} style={{ color: bonusCompleted ? '#fbbf24' : undefined }}>
                  {formatTime(bonusSecondsLeft)}
                </span>
                {bonusCompleted && <span className={styles.completedLabelGold}>Life Recovered! 🎉</span>}
              </div>
            </div>
            <div className={styles.controls}>
              {bonusUnlocked && !bonusRunning && !bonusCompleted && (
                <button onClick={handleBonusStart} className={`btn-primary ${styles.ctrlBtn} ${styles.goldBtn}`}>
                  ⭐ {bonusSecondsLeft < THREE_HOURS ? 'Resume Bonus' : 'Start Bonus'}
                </button>
              )}
              {bonusRunning && (
                <button onClick={handleBonusPause} className={`btn-secondary ${styles.ctrlBtn}`}>
                  ⏸ Pause
                </button>
              )}
            </div>
          </div>

          {/* ─── Turbo 3-Hour Timer ─── */}
          <div className={`glass-card ${styles.timerBlock} ${!bonusUnlocked ? styles.locked : ''}`}>
            <h3 className={styles.timerLabel}>
              🚀 Turbo Session
              {!bonusUnlocked && <span className={styles.badgeLocked}>🔒 Complete mandatory first</span>}
              {turboCompleted && <span className={styles.badgeGold}>🚀 +2 Lives Recovered!</span>}
            </h3>
            <div className={styles.timerWrapper}>
              {showTurboCelebration && (
                <>
                  <div className={styles.burst1Gold} />
                  <div className={styles.burst2Gold} />
                </>
              )}
              <svg className={styles.timerRing} viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                <circle
                  cx="150" cy="150" r={ringRadius} fill="none"
                  stroke={turboCompleted ? '#3b82f6' : '#60a5fa'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={turboOffset}
                  className={styles.timerRingProgress}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.3))' }}
                />
              </svg>
              <div className={styles.timerDisplay}>
                <span className={styles.time} style={{ color: turboCompleted ? '#3b82f6' : undefined }}>
                  {formatTime(turboSecondsLeft)}
                </span>
                {turboCompleted && <span className={styles.completedLabelGold}>Lives Recovered! 🎉</span>}
              </div>
            </div>
            <div className={styles.controls}>
              {bonusUnlocked && !turboRunning && !turboCompleted && (
                <button onClick={handleTurboStart} className={`btn-primary ${styles.ctrlBtn} ${styles.goldBtn}`} style={{background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderColor: '#3b82f6'}}>
                  🚀 {turboSecondsLeft < THREE_HOURS ? 'Resume Turbo' : 'Start Turbo'}
                </button>
              )}
              {turboRunning && (
                <button onClick={handleTurboPause} className={`btn-secondary ${styles.ctrlBtn}`}>
                  ⏸ Pause
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Today's Sessions */}
        <div className={`glass-card ${styles.sessionsCard}`}>
          <h3 className={styles.sessionsTitle}>Today&apos;s Sessions</h3>
          {todaySessions.length === 0 ? (
            <p className={styles.noSessions}>No sessions logged today yet</p>
          ) : (
            <div className={styles.sessionsList}>
              {todaySessions.map((s, idx) => (
                <div key={s.id || idx} className={styles.sessionItem}>
                  <span className={styles.sessionIcon}>{s.is_turbo_credit ? '🚀' : s.is_double_credit ? '⭐' : '✅'}</span>
                  <span className={styles.sessionDuration}>
                    {(s.duration_seconds / 3600).toFixed(1)} hours
                  </span>
                  <span className={styles.sessionType}>
                    {s.is_turbo_credit ? 'Turbo — 2 Lives Recovered' : s.is_double_credit ? 'Bonus — Life Recovered' : 'Mandatory'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
