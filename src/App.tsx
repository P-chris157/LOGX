import React, { useEffect, useState } from 'react';
import { initializeDatabase } from './db/database';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProgressPage } from './pages/ProgressPage';
import { WeightPage } from './pages/WeightPage';
import { SettingsPage } from './pages/SettingsPage';
import './App.css';

type TabId = 'home' | 'workout' | 'history' | 'progress' | 'weight' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
      } catch (e) {
        console.error('Failed to initialize database:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
  const handleViewportResize = () => {
    const active = document.activeElement as HTMLElement;
    if (!active || !['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
    
    window.setTimeout(() => {
      active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  window.visualViewport?.addEventListener('resize', handleViewportResize);
  return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
}, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onOpenWorkout={() => setActiveTab('workout')} />;
      case 'workout':
        return <WorkoutPage />;
      case 'history':
        return <HistoryPage />;
      case 'progress':
        return <ProgressPage />;
      case 'weight':
        return <WeightPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage onOpenWorkout={() => setActiveTab('workout')} />;
    }
  };

  return (
    <div className="app">
      <main className="main-content">
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;