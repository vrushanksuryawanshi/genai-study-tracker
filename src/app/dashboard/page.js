'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProtectedLayout from '@/components/ProtectedLayout';
import styles from './page.module.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const DEFAULT_START_DATE = new Date('2026-05-23');
const DEFAULT_TOTAL_DAYS = 200;
const DEFAULT_MAX_LIVES = 50;

function getDaysBetween(d1, d2) {
  const oneDay = 86400000;
  return Math.floor((d2 - d1) / oneDay);
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline();
      
      tl.fromTo(`.${styles.header}`, 
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      )
      .fromTo(`.${styles.daysCard}, .${styles.livesCard}, .${styles.statItem}`, 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }, 
        "-=0.5"
      )
      .fromTo(`.${styles.calendarCard}`, 
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: "power2.out" }, 
        "-=0.3"
      )
      .fromTo(`.${styles.actionCard}`, 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 
        "-=0.4"
      );
    }
  }, { dependencies: [loading], scope: containerRef });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/study');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startDateStr = stats?.startDate;
  const START_DATE = startDateStr ? new Date(startDateStr) : DEFAULT_START_DATE;
  const TOTAL_DAYS = stats?.totalDays ?? DEFAULT_TOTAL_DAYS;
  const MAX_LIVES = stats?.maxLives ?? DEFAULT_MAX_LIVES;

  const today = new Date();
  const daysPassed = Math.max(0, getDaysBetween(START_DATE, today));
  const daysRemaining = Math.max(0, TOTAL_DAYS - daysPassed);
  const progressPercent = Math.min(100, (daysPassed / TOTAL_DAYS) * 100);

  // Build calendar data
  const calendarDays = [];
  const sessionDates = new Set(sessions.map((s) => s.date));
  const doubleDates = new Set(sessions.filter((s) => s.is_double_credit).map((s) => s.date));
  const turboDates = new Set(sessions.filter((s) => s.is_turbo_credit).map((s) => s.date));

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const date = new Date(START_DATE);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const isPast = date < today && date.toDateString() !== today.toDateString();
    const isToday = date.toDateString() === today.toDateString();
    const isStudied = sessionDates.has(dateStr);
    const isDouble = doubleDates.has(dateStr);
    const isTurbo = turboDates.has(dateStr);
    const isFuture = date > today;

    let status = 'future';
    if (isToday) status = isStudied ? (isTurbo ? 'turbo' : isDouble ? 'double' : 'studied') : 'today';
    else if (isPast) status = isStudied ? (isTurbo ? 'turbo' : isDouble ? 'double' : 'studied') : 'missed';

    calendarDays.push({ date: dateStr, day: date.getDate(), month: date.getMonth(), status });
  }

  // Group by month for labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const livesRemaining = stats?.livesRemaining ?? MAX_LIVES;
  const overcharge = stats?.overcharge ?? 0;
  const hasOvercharge = overcharge > 0;
  
  const livesColor = livesRemaining > 30 ? 'green' : livesRemaining > 15 ? 'yellow' : 'red';

  // SVG Progress Ring
  const ringRadius = 80;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPercent / 100) * ringCircumference;

  if (loading) {
    return (
      <ProtectedLayout activePage="dashboard">
        <div className={styles.page}>
          <div className={styles.header}>
            <div className={`skeleton ${styles.skeletonTitle}`}></div>
            <div className={`skeleton ${styles.skeletonSub}`}></div>
          </div>
          <div className={styles.topGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`}></div>
            ))}
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout activePage="dashboard">
      <div className={styles.page} ref={containerRef}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className="gradient-text">Mission Control</span>
          </h1>
          <p className={styles.subtitle}>
            {START_DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} → Your Gen AI Engineering Journey
          </p>
        </div>

        {/* Top Row: Days Remaining + Lives + Quick Stats */}
        <div className={styles.topGrid}>
          {/* Days Remaining Card */}
          <div className={`glass-card ${styles.daysCard}`}>
            <div className={styles.ringWrapper}>
              <svg className={styles.ring} viewBox="0 0 200 200">
                <circle
                  cx="100" cy="100" r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                <circle
                  cx="100" cy="100" r={ringRadius}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className={styles.ringProgress}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className={styles.ringContent}>
                <span className={styles.daysNumber}>{daysRemaining}</span>
                <span className={styles.daysLabel}>days left</span>
              </div>
            </div>
            <p className={styles.cardFooter}>Day {Math.min(daysPassed + 1, TOTAL_DAYS)} of {TOTAL_DAYS}</p>
          </div>

          {/* Lives Card */}
          <div className={`glass-card ${styles.livesCard} ${hasOvercharge ? styles.overchargeGlow : ''}`}>
            <h3 className={styles.cardTitle}>🛡️ Lives Remaining</h3>
            <div className={`${styles.livesNumber} ${styles[`lives${livesColor.charAt(0).toUpperCase() + livesColor.slice(1)}`]}`}>
              {livesRemaining}
              <span className={styles.livesMax}>/ {MAX_LIVES}</span>
            </div>
            {hasOvercharge && (
              <div className={styles.overchargeBadge} style={{ alignSelf: 'flex-start' }}>
                ⚡ +{overcharge} Overcharge
              </div>
            )}
            <div className={styles.livesBar}>
              <div
                className={`${styles.livesBarFill} ${styles[`bar${livesColor.charAt(0).toUpperCase() + livesColor.slice(1)}`]}`}
                style={{ width: `${(Math.min(livesRemaining, MAX_LIVES) / MAX_LIVES) * 100}%` }}
              />
            </div>
            <p className={styles.livesHint}>
              {hasOvercharge 
                ? '⚡ Shields overcharged!' 
                : livesRemaining > 30
                ? '💪 Strong reserves!'
                : livesRemaining > 15
                ? '⚠️ Stay consistent'
                : '🚨 Critical — study daily!'}
            </p>
          </div>

          {/* Stats Grid Card */}
          <div className={styles.statsColumn} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className={`glass-card ${styles.statItem}`}>
              <span className={styles.statIcon}>⏰</span>
              <div>
                <div className={styles.statValue}>{(stats?.totalHours ?? 0).toFixed(1)}</div>
                <div className={styles.statLabel}>Hours</div>
              </div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <span className={styles.statIcon}>✅</span>
              <div>
                <div className={styles.statValue}>{stats?.totalDaysStudied ?? 0}</div>
                <div className={styles.statLabel}>Days</div>
              </div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <span className={styles.statIcon}>🔥</span>
              <div>
                <div className={styles.statValue}>{stats?.currentStreak ?? 0}</div>
                <div className={styles.statLabel}>Streak</div>
              </div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <span className={styles.statIcon}>⭐</span>
              <div>
                <div className={styles.statValue}>{stats?.doubleCreditDays ?? 0}</div>
                <div className={styles.statLabel}>Bonus</div>
              </div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <span className={styles.statIcon}>🚀</span>
              <div>
                <div className={styles.statValue}>{stats?.turboCreditDays ?? 0}</div>
                <div className={styles.statLabel}>Turbo</div>
              </div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <span className={styles.statIcon}>⚡</span>
              <div>
                <div className={styles.statValue}>{stats?.overcharge ?? 0}</div>
                <div className={styles.statLabel}>Overcharge</div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className={`glass-card ${styles.calendarCard}`}>
          <h3 className={styles.cardTitle}>📅 {TOTAL_DAYS}-Day Journey Map</h3>
          <div className={styles.calendarGrid}>
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`${styles.calDay} ${styles[`day${day.status.charAt(0).toUpperCase() + day.status.slice(1)}`]}`}
                title={`${day.date} — ${day.status}`}
              >
                {day.status === 'today' && <span className={styles.todayDot} />}
              </div>
            ))}
          </div>
          <div className={styles.calendarLegend}>
            <span><span className={`${styles.legendDot} ${styles.dayStudied}`} /> Studied</span>
            <span><span className={`${styles.legendDot} ${styles.dayDouble}`} /> Double Credit</span>
            <span><span className={`${styles.legendDot} ${styles.dayTurbo}`} /> Turbo Credit</span>
            <span><span className={`${styles.legendDot} ${styles.dayMissed}`} /> Missed</span>
            <span><span className={`${styles.legendDot} ${styles.dayFuture}`} /> Upcoming</span>
            <span><span className={`${styles.legendDot} ${styles.dayToday}`} /> Today</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <Link href="/timer" className={`glass-card ${styles.actionCard}`}>
            <span className={styles.actionIcon}>⏱️</span>
            <span className={styles.actionLabel}>Start Timer</span>
          </Link>
          <Link href="/project" className={`glass-card ${styles.actionCard}`}>
            <span className={styles.actionIcon}>📝</span>
            <span className={styles.actionLabel}>Project Notes</span>
          </Link>
          <Link href="/tools" className={`glass-card ${styles.actionCard}`}>
            <span className={styles.actionIcon}>🛠️</span>
            <span className={styles.actionLabel}>Tools Catalog</span>
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  );
}
