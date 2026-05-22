'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import styles from './page.module.css';

export default function ProjectPage() {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      const res = await fetch('/api/project');
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || '');
        if (data.updated_at) setLastUpdated(new Date(data.updated_at));
      }
    } catch (e) {
      console.error('Failed to load project:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = useCallback(async (text) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLastUpdated(new Date());
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      setSaveStatus('error');
    }
  }, []);

  const handleChange = (e) => {
    const text = e.target.value;
    setContent(text);
    setSaveStatus('typing');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveProject(text);
    }, 1500);
  };

  return (
    <ProtectedLayout activePage="project">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              <span className="gradient-text">Project Space</span>
            </h1>
            <p className={styles.subtitle}>
              Document your Gen AI projects, architecture, goals & learnings
            </p>
          </div>
          <div className={styles.headerRight}>
            <div className={`${styles.saveIndicator} ${styles[saveStatus]}`}>
              {saveStatus === 'saving' && '💾 Saving...'}
              {saveStatus === 'saved' && '✅ Saved'}
              {saveStatus === 'error' && '❌ Error saving'}
              {saveStatus === 'typing' && '✏️ Typing...'}
            </div>
          </div>
        </div>

        <div className={`glass-card ${styles.editorCard}`}>
          {loading ? (
            <div className={`skeleton ${styles.editorSkeleton}`}></div>
          ) : (
            <textarea
              value={content}
              onChange={handleChange}
              placeholder={`Describe your Gen AI projects, architecture, goals, learnings...\n\n## My Gen AI Capstone Project\n\n### Goal\nBuild an end-to-end RAG pipeline...\n\n### Architecture\n- Vector Database: Pinecone\n- LLM: GPT-4 / Gemini\n- Framework: LangChain\n\n### Progress Notes\n- Week 1: Set up development environment...\n- Week 2: Implemented document ingestion...`}
              className={styles.editor}
              spellCheck="false"
            />
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.charCount}>
            {content.length.toLocaleString()} characters
          </span>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              Last saved: {lastUpdated.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
