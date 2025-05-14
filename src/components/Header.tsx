import React, { useState } from 'react';
import styles from '../app.module.css';

interface HeaderProps {
  showTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ showTab }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logo}>
        <img src="./img/unnamed.png" alt="Turi Logo" />
      </div>

      {/* Botão de menu hambúrguer */}
      <button className={styles.hamburger} onClick={toggleMenu}>
        &#9776; {/* Ícone de hambúrguer */}
      </button>

      {/* Menu de navegação (condicional para mobile) */}
      <nav
        className={`${styles.navContainer} ${
          menuOpen ? styles.active : ''
        }`}
      >
        <button className={styles.navBtn} onClick={() => showTab('inicio')}>
          Início
        </button>
        <button className={styles.navBtn} onClick={() => showTab('mapa')}>
          Mapa
        </button>
        <button className={styles.navBtn} onClick={() => showTab('dados')}>
          Dados
        </button>
        <button className={styles.navBtn} onClick={() => showTab('quem')}>
          Quem Somos
        </button>
      </nav>
    </header>
  );
};

export default Header;