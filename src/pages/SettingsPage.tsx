import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Trash2, AlertTriangle, Key, Scale, Timer, SunMoon } from 'lucide-react';
import { getSettings, saveSettings, clearSettings } from '../utils/settings';
import { exportAllData, importData, downloadFile } from '../utils/backup';
import { clearWorkoutData } from '../db/database';
import { importWorkoutFromText } from '../utils/importFromText';
import './SettingsPage.css';

type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => Promise<void> | void;
};

export function SettingsPage() {
  const [settings, setSettings] = useState(getSettings());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(settings.openaiApiKey || '');
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyTheme = (theme: 'dark' | 'light' | 'system') => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      return;
    }

    root.setAttribute('data-theme', theme);
  };

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);

    if (key === 'theme') {
      applyTheme(value as 'dark' | 'light' | 'system');
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const date = new Date().toISOString().split('T')[0];
      downloadFile(data, `logx-backup-${date}.json`);
      setMessage({ type: 'success', text: 'Backup downloaded successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setConfirmState({
      open: true,
      title: 'Import Backup',
      message: 'This will replace your current workout data. Continue?',
      confirmText: 'Import',
      onConfirm: async () => {
        try {
          const text = await file.text();
          const result = await importData(text);
          setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        } catch {
          setMessage({ type: 'error', text: 'Failed to import backup' });
        }
        e.target.value = '';
      }
    });
  };

  const handleClearData = async () => {
    setConfirmState({
      open: true,
      title: 'Delete All Workout Data',
      message: 'This will permanently delete workouts, sets, body weight entries, and AI summaries from this device.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await clearWorkoutData();
          clearSettings();
          const reset = getSettings();
          setSettings(reset);
          setApiKey(reset.openaiApiKey || '');
          applyTheme(reset.theme);
          setMessage({ type: 'success', text: 'All workout data deleted' });
          window.location.reload();
        } catch (e) {
          console.error('Clear data failed:', e);
          setMessage({ type: 'error', text: 'Failed to clear data' });
        }
      }
    });
  };

  const handleSaveApiKey = () => {
    updateSetting('openaiApiKey', apiKey.trim() || undefined);
    setShowApiKey(false);
    setMessage({ type: 'success', text: apiKey.trim() ? 'API key saved' : 'API key removed' });
  };

  const runConfirm = async () => {
    if (!confirmState.onConfirm) return;
    await confirmState.onConfirm();
    setConfirmState(prev => ({ ...prev, open: false }));
  };

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="settings-section">
        <h2>Preferences</h2>

        <div className="setting-item">
          <div className="setting-info">
            <Scale size={20} />
            <span>Weight Unit</span>
          </div>
          <select
            value={settings.units}
            onChange={e => updateSetting('units', e.target.value as 'lb' | 'kg')}
          >
            <option value="lb">Pounds (lb)</option>
            <option value="kg">Kilograms (kg)</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <Timer size={20} />
            <span>Rest Timer</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.timerEnabled}
              onChange={e => updateSetting('timerEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {settings.timerEnabled && (
          <div className="setting-item">
            <div className="setting-info">
              <span className="indent">Timer Duration</span>
            </div>
            <select
              value={settings.timerDuration}
              onChange={e => updateSetting('timerDuration', parseInt(e.target.value))}
            >
              <option value="30">30 sec</option>
              <option value="60">1 min</option>
              <option value="90">1:30 min</option>
              <option value="120">2 min</option>
              <option value="180">3 min</option>
              <option value="300">5 min</option>
            </select>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h2>Backup & Restore</h2>
        <p className="section-desc">
          <AlertTriangle size={16} />
          Export backup from Safari on iPhone. Home Screen apps may not show downloaded files clearly.
        </p>

        <button className="action-btn" onClick={handleExport}>
          <Download size={20} />
          <span>Export Backup</span>
        </button>

        <button className="action-btn" onClick={() => fileInputRef.current?.click()}>
          <Upload size={20} />
          <span>Import Backup</span>
        </button>

  

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>

      <div className="settings-section">
        <h2>AI Features (Optional)</h2>
        <p className="section-desc">
          AI features require your own OpenAI API key. You will be charged by OpenAI for usage.
        </p>

        <button className="action-btn" onClick={() => setShowApiKey(true)}>
          <Key size={20} />
          <span>{settings.openaiApiKey ? 'Update API Key' : 'Add OpenAI API Key'}</span>
          {settings.openaiApiKey && <span className="badge">Active</span>}
        </button>
      </div>

      <div className="settings-section danger">
        <h2>Danger Zone</h2>

        <button className="action-btn danger" onClick={handleClearData}>
          <Trash2 size={20} />
          <span>Delete All Workout Data</span>
        </button>
      </div>

      {showApiKey && (
        <div className="modal-overlay" onClick={() => setShowApiKey(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>OpenAI API Key</h3>
            <p className="modal-desc">
              Your key is stored locally and only used to call OpenAI directly from your browser.
            </p>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowApiKey(false)} className="btn-cancel">Cancel</button>
              <button onClick={handleSaveApiKey} className="btn-save">Save</button>
            </div>
          </div>
        </div>
      )}

      {confirmState.open && (
        <div className="modal-overlay" onClick={() => setConfirmState(prev => ({ ...prev, open: false }))}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>{confirmState.title}</h3>
            <p className="modal-desc">{confirmState.message}</p>
            <div className="modal-actions">
              <button
                onClick={() => setConfirmState(prev => ({ ...prev, open: false }))}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={runConfirm} className="btn-danger">
                {confirmState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-info">
        <p>LOGX v6.9</p>
        <p>Data stored locally on your device</p>
      </div>
    </div>
  );
}