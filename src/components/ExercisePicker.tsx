import React, { useState, useMemo } from 'react';
import { Search, Plus, X, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Exercise } from '../types';
import { v4 as uuid } from 'uuid';
import './ExercisePicker.css';

interface Props {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  excludeIds?: string[];
}

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Biceps',
  'Triceps',
  'Core',
  'Glutes',
  'Calves',
  'Cardio',
  'Forearms'
];

export function ExercisePicker({ onSelect, onClose, excludeIds = [] }: Props) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscleGroup: 'Chest', equipment: 'Barbell' });

  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  const availableExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(e => !excludeIds.includes(e.id));
  }, [exercises, excludeIds]);

  const filteredExercises = useMemo(() => {
    if (!availableExercises || !selectedGroup) return [];

    return availableExercises
      .filter(e => e.muscleGroup === selectedGroup)
      .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableExercises, selectedGroup, search]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of MUSCLE_GROUPS) {
      counts[group] = availableExercises.filter(e => e.muscleGroup === group).length;
    }
    return counts;
  }, [availableExercises]);

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) return;

    const exercise: Exercise = {
      id: uuid(),
      name: newExercise.name.trim(),
      muscleGroup: newExercise.muscleGroup,
      equipment: newExercise.equipment,
      isCustom: true
    };

    await db.exercises.add(exercise);
    setShowAddNew(false);
    setNewExercise({ name: '', muscleGroup: 'Chest', equipment: 'Barbell' });
    onSelect(exercise);
  };

  return (
    <div className="picker-overlay">
      <div className="picker-modal">
        <div className="picker-header">
          <div className="picker-header-left">
            {selectedGroup && !showAddNew && (
              <button
                onClick={() => {
                  setSelectedGroup(null);
                  setSearch('');
                }}
                className="back-btn"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2>{showAddNew ? 'Add Exercise' : selectedGroup ? selectedGroup : 'Select Exercise'}</h2>
          </div>
          <button onClick={onClose} className="close-btn"><X size={24} /></button>
        </div>

        {!showAddNew && (
          <>
            {selectedGroup && (
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder={`Search ${selectedGroup.toLowerCase()} exercises...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}

            <div className="exercise-list">
              {!selectedGroup ? (
                <>
                  <button className="add-new-btn" onClick={() => setShowAddNew(true)}>
                    <Plus size={20} />
                    <span>Add New Exercise</span>
                  </button>

                  {MUSCLE_GROUPS.map(group => (
                    <button
                      key={group}
                      className="exercise-item group-item"
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="exercise-info">
                        <span className="exercise-name">{group}</span>
                        <span className="exercise-meta">{groupCounts[group] || 0} exercises</span>
                      </div>
                      <ChevronRight size={18} className="group-chevron" />
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button className="add-new-btn" onClick={() => setShowAddNew(true)}>
                    <Plus size={20} />
                    <span>Add New Exercise</span>
                  </button>

                  {filteredExercises.map(exercise => (
                    <button
                      key={exercise.id}
                      className="exercise-item"
                      onClick={() => onSelect(exercise)}
                    >
                      <div className="exercise-info">
                        <span className="exercise-name">{exercise.name}</span>
                        <span className="exercise-meta">{exercise.muscleGroup} • {exercise.equipment}</span>
                      </div>
                      {exercise.isCustom && <span className="custom-badge">Custom</span>}
                    </button>
                  ))}

                  {filteredExercises.length === 0 && (
                    <div className="picker-empty-state">
                      <p>No exercises found</p>
                      <span>Try another search or add a custom exercise.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {showAddNew && (
          <div className="add-new-form">
            <h3>Add New Exercise</h3>
            <input
              type="text"
              placeholder="Exercise name"
              value={newExercise.name}
              onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
            />
            <select
              value={newExercise.muscleGroup}
              onChange={e => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
            >
              {MUSCLE_GROUPS.map(mg => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
            <select
              value={newExercise.equipment}
              onChange={e => setNewExercise({ ...newExercise, equipment: e.target.value })}
            >
              {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Other'].map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
            <div className="form-actions">
              <button onClick={() => setShowAddNew(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAddExercise} className="btn-primary">
                <Check size={18} /> Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}