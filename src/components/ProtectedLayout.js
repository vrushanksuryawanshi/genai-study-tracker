'use client';

import Navbar from './Navbar';
import styles from './ProtectedLayout.module.css';

export default function ProtectedLayout({ children, activePage }) {
  return (
    <div className={styles.layout}>
      <Navbar activePage={activePage} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
