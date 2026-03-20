import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'fitlog_settings';

export function getSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<Settings>): void {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function clearSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}
