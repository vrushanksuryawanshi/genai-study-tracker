'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import styles from './page.module.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Get local YYYY-MM-DD string (timezone-safe)
function getLocalDateStr(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
}

export default function DiaryPage() {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [content, setContent] = useState('');
  const [hoursStudied, setHoursStudied] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline();
      
      tl.fromTo(`.${styles.header}`, 
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
      )
      .fromTo(`.${styles.dateItem}`, 
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }, 
        "-=0.2"
      )
      .fromTo(`.${styles.editorCard}`, 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, 
        "-=0.4"
      );
    }
  }, { dependencies: [loading], scope: containerRef });

  useEffect(() => {
    fetchAllEntries();
  }, []);

  useEffect(() => {
    // When date changes, load that entry
    const entry = entries.find((e) => e.date === selectedDate);
    if (entry) {
      setContent(entry.content || '');
      setHoursStudied(entry.hours_studied || 0);
    } else {
      setContent('');
      setHoursStudied(0);
    }
  }, [selectedDate, entries]);

  const fetchAllEntries = async () => {
    try {
      const res = await fetch('/api/diary');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error('Failed to fetch diary:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = useCallback(async (date, text, hours) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          content: text,
          hours_studied: hours,
        }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        const data = await res.json();
        setEntries((prev) => {
          const idx = prev.findIndex((e) => e.date === date);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data.entry;
            return updated;
          }
          return [data.entry, ...prev];
        });
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      setSaveStatus('error');
    }
  }, []);

  const handleContentChange = (e) => {
    const text = e.target.value;
    setContent(text);
    setSaveStatus('typing');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveEntry(selectedDate, text, hoursStudied);
    }, 1500);
  };

  const handleHoursChange = (e) => {
    const hours = parseFloat(e.target.value) || 0;
    setHoursStudied(hours);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveEntry(selectedDate, content, hours);
    }, 1000);
  };

  // Generate dates from May 23, 2026 to today (or end of timeline)
  const todayStr = getLocalDateStr();
  const startDate = new Date('2026-05-23T00:00:00');
  const todayLocal = new Date(todayStr + 'T00:00:00');
  const endDate = new Date(Math.min(todayLocal.getTime(), new Date('2026-12-08T00:00:00').getTime()));

  const dateList = [];
  const d = new Date(endDate);
  while (d >= startDate) {
    dateList.push(getLocalDateStr(d));
    d.setDate(d.getDate() - 1);
  }

  const entryMap = {};
  entries.forEach((e) => { entryMap[e.date] = e; });

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isToday = selectedDate === todayStr;

  return (
    <ProtectedLayout activePage="diary">
      <div className={styles.page} ref={containerRef}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className="gradient-text">Study Diary</span>
          </h1>
          <p className={styles.subtitle}>
            Record what you studied each day
          </p>
        </div>

        <div className={styles.layout}>
          {/* Date Sidebar */}
          <div className={`glass-card ${styles.dateSidebar}`}>
            <h3 className={styles.sidebarTitle}>📅 Dates</h3>
            <div className={styles.dateList}>
              {dateList.map((date) => {
                const hasEntry = entryMap[date] && entryMap[date].content;
                const hrs = entryMap[date]?.hours_studied || 0;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`${styles.dateItem} ${date === selectedDate ? styles.dateActive : ''} ${hasEntry ? styles.dateHasEntry : ''}`}
                  >
                    <span className={styles.dateLabel}>{formatDateLabel(date)}</span>
                    {hrs > 0 && (
                      <span className={styles.dateHours}>{hrs}h</span>
                    )}
                    {hasEntry && <span className={styles.dateDot} />}
                  </button>
                );
              })}
              {dateList.length === 0 && (
                <p className={styles.noDates}>Timeline starts May 23, 2026</p>
              )}
            </div>
          </div>

          {/* Editor Area */}
          <div className={styles.editorArea}>
            <div className={`glass-card ${styles.editorCard}`}>
              <div className={styles.editorHeader}>
                <div>
                  <h2 className={styles.editorDate}>
                    {formatDateLabel(selectedDate)}
                    {isToday && <span className={styles.todayBadge}>Today</span>}
                  </h2>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.datePicker}
                    min="2026-05-23"
                    max="2026-12-08"
                  />
                </div>
                <div className={styles.editorMeta}>
                  <div className={styles.hoursInput}>
                    <label className={styles.hoursLabel}>Hours studied</label>
                    <input
                      type="number"
                      value={hoursStudied}
                      onChange={handleHoursChange}
                      min="0"
                      max="24"
                      step="0.5"
                      className={`input-field ${styles.hoursField}`}
                    />
                  </div>
                  <div className={`${styles.saveIndicator} ${styles[saveStatus]}`}>
                    {saveStatus === 'saving' && '💾 Saving...'}
                    {saveStatus === 'saved' && '✅ Saved'}
                    {saveStatus === 'error' && '❌ Error'}
                    {saveStatus === 'typing' && '✏️ Typing...'}
                  </div>
                </div>
              </div>

              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder={`What did you study today?\n\n• Topics covered...\n• Key takeaways...\n• Resources used...\n• Challenges faced...\n• Tomorrow's plan...`}
                className={styles.editor}
                spellCheck="false"
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
