import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../db/database';
import { v4 as uuid } from 'uuid';
import { getToday, formatDateShort } from '../utils/date';
import { getSettings } from '../utils/settings';
import './WeightPage.css';

export function WeightPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const settings = getSettings();

  const entries = useLiveQuery(
    () => db.bodyWeightEntries.orderBy('date').reverse().toArray(),
    []
  );

  const chartData = entries?.slice().reverse().map(e => ({
    date: formatDateShort(e.date),
    weight: e.weight
  }));

  const latestWeight = entries?.[0]?.weight;
  const previousWeight = entries?.[1]?.weight;
  const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  const handleAdd = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    await db.bodyWeightEntries.add({
      id: uuid(),
      date: getToday(),
      weight
    });

    setNewWeight('');
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this entry?')) {
      await db.bodyWeightEntries.delete(id);
    }
  };

  return (
    <div className="page weight-page">
      <div className="page-header">
        <h1>Body Weight</h1>
        <button className="add-btn" onClick={() => setShowAdd(true)}>
          <Plus size={20} />
        </button>
      </div>

      {/* Current Weight */}
      {latestWeight && (
        <div className="current-weight">
          <Scale size={32} />
          <div className="weight-info">
            <span className="weight-value">{latestWeight} {settings.units}</span>
            {weightChange !== null && (
              <span className={`weight-change ${weightChange < 0 ? 'down' : 'up'}`}>
                {weightChange < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                {Math.abs(weightChange).toFixed(1)} {settings.units}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData && chartData.length > 1 && (
        <div className="chart-section">
          <h2>Trend</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-muted)" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="var(--primary)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', strokeWidth: 0 }}
                  name={`Weight (${settings.units})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History */}
      <div className="history-section">
        <h2>History</h2>
        {entries?.length === 0 ? (
          <div className="empty-state">
            <Scale size={48} />
            <p>No entries yet</p>
            <span>Tap + to log your weight</span>
          </div>
        ) : (
          <div className="entries-list">
            {entries?.map(entry => (
              <div key={entry.id} className="entry-item" onClick={() => handleDelete(entry.id)}>
                <span className="entry-date">{formatDateShort(entry.date)}</span>
                <span className="entry-weight">{entry.weight} {settings.units}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Log Weight</h3>
            <div className="input-group">
              <input
                type="number"
                placeholder="Weight"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                autoFocus
                inputMode="decimal"
              />
              <span className="unit">{settings.units}</span>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAdd(false)} className="btn-cancel">Cancel</button>
              <button onClick={handleAdd} className="btn-save">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
