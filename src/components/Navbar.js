'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './Navbar.module.css';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
  { key: 'timer', label: 'Timer', icon: '⏱️', href: '/timer' },
  { key: 'diary', label: 'Diary', icon: '📖', href: '/diary' },
  { key: 'project', label: 'Project', icon: '📝', href: '/project' },
  { key: 'tools', label: 'Tools', icon: '🛠️', href: '/tools' },
];

export default function Navbar({ activePage }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🚀</span>
        <span className={styles.brandLabel}>GenAI</span>
      </div>

      <div className={styles.navLinks}>
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`${styles.navItem} ${activePage === item.key ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {activePage === item.key && <span className={styles.activeIndicator} />}
          </Link>
        ))}
      </div>

      <button onClick={handleLogout} className={styles.logoutBtn}>
        <span className={styles.navIcon}>🚪</span>
        <span className={styles.navLabel}>Logout</span>
      </button>
    </nav>
  );
}
