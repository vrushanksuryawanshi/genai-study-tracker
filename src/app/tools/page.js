'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import styles from './page.module.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const CATEGORIES = [
  'AI/ML',
  'Frameworks',
  'Languages',
  'Libraries',
  'Platforms',
  'Databases',
  'DevOps',
  'General',
];

const PRESET_LOGOS = [
  { name: 'Python', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'JavaScript', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'TypeScript', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'React', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'Next.js', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
  { name: 'TensorFlow', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg' },
  { name: 'PyTorch', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg' },
  { name: 'Docker', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'Git', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { name: 'MongoDB', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
  { name: 'PostgreSQL', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'AWS', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  { name: 'GCP', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg' },
  { name: 'Linux', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
  { name: 'Jupyter', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg' },
  { name: 'Pandas', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg' },
  { name: 'NumPy', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg' },
  { name: 'Kubernetes', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
  { name: 'Redis', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg' },
  { name: 'VSCode', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
];

export default function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'AI/ML',
    logo_url: '',
    status: 'remaining',
    hours_required: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline();
      
      tl.fromTo(`.${styles.header}`, 
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      )
      .fromTo(`.${styles.statsBar}`, 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 
        "-=0.4"
      )
      .fromTo(`.${styles.filterTabs}`, 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 
        "-=0.3"
      )
      .fromTo(`.${styles.toolCard}`, 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "back.out(1.2)" }, 
        "-=0.2"
      );
    }
  }, { dependencies: [loading, filter], scope: containerRef });

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const res = await fetch('/api/tools');
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch (e) {
      console.error('Failed to fetch tools:', e);
    } finally {
      setLoading(false);
    }
  };

  const addTool = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData({ name: '', category: 'AI/ML', logo_url: '', status: 'remaining', hours_required: 0 });
        setShowForm(false);
        fetchTools();
      } else {
        console.error('Failed to add tool:', data);
        alert('Failed to add tool: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Failed to add tool:', e);
      alert('Network error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (tool) => {
    const newStatus = tool.status === 'covered' ? 'remaining' : 'covered';
    try {
      await fetch(`/api/tools/${tool.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setTools((prev) =>
        prev.map((t) => (t.id === tool.id ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      console.error('Failed to toggle tool:', e);
    }
  };

  const handleFileUpload = (e, tool) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to ~1MB to avoid massive payloads)
    if (file.size > 1024 * 1024) {
      alert("File is too large. Please use an image under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      try {
        const res = await fetch(`/api/tools/${tool.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo_url: dataUrl }),
        });
        if (res.ok) {
          setTools((prev) =>
            prev.map((t) => (t.id === tool.id ? { ...t, logo_url: dataUrl } : t))
          );
        } else {
          alert('Failed to update logo. Payload might be too large.');
        }
      } catch (err) {
        console.error('Failed to update logo:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteTool = async (id) => {
    if (!confirm('Delete this tool?')) return;
    try {
      await fetch(`/api/tools/${id}`, { method: 'DELETE' });
      setTools((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error('Failed to delete tool:', e);
    }
  };

  const selectPresetLogo = (preset) => {
    setFormData((prev) => ({
      ...prev,
      logo_url: preset.url,
      name: prev.name || preset.name,
    }));
  };

  const filteredTools =
    filter === 'all'
      ? tools
      : tools.filter((t) => t.status === filter);

  const coveredCount = tools.filter((t) => t.status === 'covered').length;
  const progressPercent = tools.length > 0 ? (coveredCount / tools.length) * 100 : 0;
  
  const hoursCompleted = tools.filter((t) => t.status === 'covered').reduce((sum, t) => sum + Number(t.hours_required || 0), 0);
  const hoursPlanned = tools.filter((t) => t.status === 'remaining').reduce((sum, t) => sum + Number(t.hours_required || 0), 0);

  return (
    <ProtectedLayout activePage="tools">
      <div className={styles.page} ref={containerRef}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <span className="gradient-text">Tools & Technologies</span>
            </h1>
            <p className={styles.subtitle}>
              Track your AI/ML toolkit mastery journey
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`btn-primary ${styles.addBtn}`}
          >
            {showForm ? '✕ Close' : '+ Add Tool'}
          </button>
        </div>

        {/* Stats Bar */}
        <div className={`glass-card ${styles.statsBar}`} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div className={styles.statsText}>
              <span className={styles.statsHighlight}>{coveredCount}</span> of{' '}
              <span className={styles.statsHighlight}>{tools.length}</span> tools covered
            </div>
            <div className={styles.progressBar} style={{marginTop: '10px'}}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div style={{textAlign: 'right'}}>
            <div className={styles.statsText} style={{fontSize: '0.9rem'}}>
              <span className={styles.statsHighlight}>{hoursCompleted}</span> hrs ({(hoursCompleted / 3).toFixed(1)} days) completed
            </div>
            <div className={styles.statsText} style={{fontSize: '0.9rem'}}>
              <span className={styles.statsHighlight}>{hoursPlanned}</span> hrs ({(hoursPlanned / 3).toFixed(1)} days) planned
            </div>
          </div>
        </div>

        {/* Add Tool Form */}
        {showForm && (
          <div className={`glass-card ${styles.formCard}`}>
            <h3 className={styles.formTitle}>Add a New Tool</h3>
            <form onSubmit={addTool} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tool Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. LangChain"
                    className="input-field"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className={`input-field ${styles.select}`}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, logo_url: e.target.value }))
                    }
                    placeholder="https://example.com/logo.svg"
                    className="input-field"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hours Required</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.hours_required}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hours_required: e.target.value }))
                    }
                    placeholder="e.g. 6"
                    className="input-field"
                  />
                  {formData.hours_required > 0 && (
                    <span className={styles.daysHint}>≈ {(formData.hours_required / 3).toFixed(1)} days</span>
                  )}
                </div>
              </div>

              {/* Preset Logos */}
              <div className={styles.presetSection}>
                <label className={styles.formLabel}>Quick Pick — Common Logos</label>
                <div className={styles.presetGrid}>
                  {PRESET_LOGOS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => selectPresetLogo(preset)}
                      className={`${styles.presetItem} ${formData.logo_url === preset.url ? styles.presetSelected : ''}`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className={styles.presetImg} />
                      <span className={styles.presetName}>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '⏳ Adding...' : '+ Add Tool'}
              </button>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          {[
            { key: 'all', label: `All (${tools.length})` },
            { key: 'covered', label: `Covered ✓ (${coveredCount})` },
            { key: 'remaining', label: `Remaining (${tools.length - coveredCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`${styles.filterTab} ${filter === tab.key ? styles.filterActive : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        {loading ? (
          <div className={styles.toolsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`skeleton ${styles.toolSkeleton}`} />
            ))}
          </div>
        ) : filteredTools.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <p className={styles.emptyText}>
              {tools.length === 0
                ? 'No tools added yet. Click "Add Tool" to get started!'
                : 'No tools match this filter.'}
            </p>
          </div>
        ) : (
          <div className={styles.toolsGrid}>
            {filteredTools.map((tool, idx) => (
              <div
                key={tool.id}
                className={`glass-card ${styles.toolCard} ${tool.status === 'covered' ? styles.toolCovered : ''}`}
              >
                <button
                  onClick={() => deleteTool(tool.id)}
                  className={styles.deleteBtn}
                  title="Delete tool"
                >
                  ✕
                </button>
                <div className={styles.toolLogo} style={{ position: 'relative' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }} title="Upload new icon">
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => handleFileUpload(e, tool)}
                    />
                    {tool.logo_url ? (
                      <img
                        src={tool.logo_url}
                        alt={tool.name}
                        className={styles.logoImg}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span
                      className={styles.logoFallback}
                      style={tool.logo_url ? { display: 'none' } : {}}
                    >
                      🔧
                    </span>
                    <div style={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      background: 'var(--accent-purple)',
                      borderRadius: '50%',
                      padding: '4px',
                      fontSize: '10px',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      ✏️
                    </div>
                  </label>
                </div>
                <h4 className={styles.toolName}>{tool.name}</h4>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <span className={styles.toolCategory}>{tool.category}</span>
                  {tool.hours_required > 0 && (
                    <span className={styles.toolHours}>{tool.hours_required} hrs ({(tool.hours_required / 3).toFixed(1)} days)</span>
                  )}
                </div>
                <button
                  onClick={() => toggleStatus(tool)}
                  className={`${styles.statusToggle} ${tool.status === 'covered' ? styles.statusCovered : styles.statusRemaining}`}
                >
                  {tool.status === 'covered' ? '✅ Covered' : '○ Remaining'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
