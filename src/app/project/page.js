'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import styles from './page.module.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function ProjectPage() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
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
      .fromTo(`.${styles.newBtn}`, 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 
        "-=0.3"
      )
      .fromTo(`.${styles.projectItem}`, 
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }, 
        "-=0.2"
      )
      .fromTo(`.${styles.editorCard}`, 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, 
        "-=0.4"
      )
      .fromTo(`.${styles.footer}`, 
        { opacity: 0 },
        { opacity: 1, duration: 0.4 }, 
        "-=0.2"
      );
    }
  }, { dependencies: [loading], scope: containerRef });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/project');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        if (data.projects && data.projects.length > 0 && !activeProject) {
          selectProject(data.projects[0]);
        } else if (!activeProject) {
          createNewProject();
        }
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectProject = (proj) => {
    setActiveProject(proj);
    setContent(proj.content || '');
    setTitle(proj.title || 'Untitled Project');
    if (proj.updated_at) setLastUpdated(new Date(proj.updated_at));
    else setLastUpdated(null);
  };

  const createNewProject = () => {
    const newProj = { id: null, title: 'New Project', content: '' };
    setActiveProject(newProj);
    setContent('');
    setTitle('New Project');
    setLastUpdated(null);
  };

  const saveProject = useCallback(async (currentId, currentTitle, currentText) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentId, title: currentTitle, content: currentText }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveStatus('saved');
        setLastUpdated(new Date());
        
        // Update list and active project
        setProjects((prev) => {
          const exists = prev.find((p) => p.id === data.project.id);
          if (exists) {
            return prev.map((p) => p.id === data.project.id ? data.project : p);
          }
          return [data.project, ...prev];
        });
        setActiveProject(data.project);

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
    triggerSave(title, text);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerSave(newTitle, content);
  };

  const triggerSave = (t, c) => {
    setSaveStatus('typing');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveProject(activeProject?.id, t, c);
    }, 1500);
  };

  return (
    <ProtectedLayout activePage="project">
      <div className={styles.page} ref={containerRef}>
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

        <div className={styles.layout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <button onClick={createNewProject} className={`btn-primary ${styles.newBtn}`}>
              + New Note
            </button>
            <div className={styles.projectList}>
              {loading ? (
                <div className={`skeleton ${styles.editorSkeleton}`} style={{height: '100px'}} />
              ) : projects.length === 0 ? (
                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px'}}>No notes yet.</p>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    className={`${styles.projectItem} ${activeProject?.id === p.id ? styles.active : ''}`}
                    onClick={() => selectProject(p)}
                  >
                    <div className={styles.projectTitle}>{p.title || 'Untitled Project'}</div>
                    <div className={styles.projectDate}>
                      {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Unsaved'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Editor Area */}
          <div className={styles.editorContainer}>
            <div className={`glass-card ${styles.editorCard}`}>
              {loading ? (
                <div className={`skeleton ${styles.editorSkeleton}`}></div>
              ) : (
                <>
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Project Title"
                    className={styles.titleInput}
                  />
                  <textarea
                    value={content}
                    onChange={handleContentChange}
                    placeholder={`Describe your Gen AI projects, architecture, goals, learnings...\n\n## My Gen AI Capstone Project\n\n### Goal\nBuild an end-to-end RAG pipeline...\n\n### Architecture\n- Vector Database: Pinecone\n- LLM: GPT-4 / Gemini\n- Framework: LangChain\n\n### Progress Notes\n- Week 1: Set up development environment...\n- Week 2: Implemented document ingestion...`}
                    className={styles.editor}
                    spellCheck="false"
                  />
                </>
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
        </div>
      </div>
    </ProtectedLayout>
  );
}
