import React from 'react';
import { House, Dumbbell, History, TrendingUp, Settings, Scale } from 'lucide-react';
import './BottomNav.css';

type TabId = 'home' | 'workout' | 'history' | 'progress' | 'weight' | 'settings';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: Props) {
  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <House size={22} />, label: 'Home' },
    { id: 'workout', icon: <Dumbbell size={22} />, label: 'Workout' },
    { id: 'history', icon: <History size={22} />, label: 'History' },
    { id: 'progress', icon: <TrendingUp size={22} />, label: 'Progress' },
    { id: 'weight', icon: <Scale size={22} />, label: 'Weight' },
    { id: 'settings', icon: <Settings size={22} />, label: 'Settings' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}