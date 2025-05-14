import React, { useState } from 'react';
import css from "./app.module.css";
import Header from './components/Header';
import Footer from './components/Footer';
import Mapa from './tabs/Mapa';
import Dados from './tabs/Dados';
import Inicio from './tabs/Inicio';
import QuemSomos from './tabs/QuemSomos';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('inicio');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className={css.app}>
      <Header showTab={handleTabChange} />
      <main className={css.main}>
        {activeTab === 'inicio' && <Inicio />}
        {activeTab === 'mapa' && <Mapa />}
        {activeTab === 'dados' && <Dados />}
        {activeTab === 'quem' && <QuemSomos />}
      </main>
      <Footer />
    </div>
  );
};

export default App;