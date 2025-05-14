import React from 'react';
import styles from '../Styles/Layout.module.css';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Turi Logo" className={styles.logo} />
        </div>
        <nav className={styles.nav}>
          <a href="/" className={styles.link}>Início</a>
          <a href="/mapa" className={styles.link}>Mapa</a>
          <a href="/dados" className={styles.link}>Dados</a>
          <a href="/sobre" className={styles.link}>Quem Somos</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Projeto TURI © 2025 | Equipe MYOPES</p>
        <p>Email: myopes@gmail.com</p>
        <div className={styles.footerLogos}>
          <img src="/icons/turi.png" alt="Turi Burned" />
          <img src="/icons/myopes.png" alt="Myopes" />
        </div>
      </footer>
    </div>
  );
};

export default Layout;