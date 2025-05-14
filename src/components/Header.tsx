import React from 'react';
import styles from '../app.module.css';

interface HeaderProps {
  showTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ showTab }) => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <img src="./img/unnamed.png" alt="Turi Logo" />
      </div>
      <div className={styles.navContainer}>
        <button className={styles.navBtn} onClick={() => showTab('inicio')}>Início</button>
        <button className={styles.navBtn} onClick={() => showTab('mapa')}>Mapa</button>
        <button className={styles.navBtn} onClick={() => showTab('dados')}>Dados</button>
        <button className={styles.navBtn} onClick={() => showTab('quem')}>Quem Somos</button>
      </div>
    </header>
  );
};

export default Header;