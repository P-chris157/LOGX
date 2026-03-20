export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  isCustom: boolean;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  duration?: number;
  notes?: string;
  templateId?: string;
  completedAt?: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
  completedAt?: string;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  reps?: number;
  notes?: string;
}

export interface AISummary {
  id: string;
  workoutId: string;
  summary: string;
  createdAt: string;
}

export interface Settings {
  units: 'lb' | 'kg';
  timerDuration: number;
  timerEnabled: boolean;
  theme: 'dark';
  openaiApiKey?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  units: 'lb',
  timerDuration: 90,
  timerEnabled: true,
  theme: 'dark',
};
