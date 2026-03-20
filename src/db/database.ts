import Dexie, { Table } from 'dexie';
import type { Exercise, Workout, WorkoutExercise, WorkoutSet, BodyWeightEntry, Template, AISummary } from '../types';
import { seedExercises } from './seedExercises';

export class FitLogDB extends Dexie {
  exercises!: Table<Exercise>;
  workouts!: Table<Workout>;
  workoutExercises!: Table<WorkoutExercise>;
  sets!: Table<WorkoutSet>;
  bodyWeightEntries!: Table<BodyWeightEntry>;
  templates!: Table<Template>;
  aiSummaries!: Table<AISummary>;

  constructor() {
    super('FitLogDB');
    this.version(1).stores({
      exercises: 'id, name, muscleGroup, equipment, isCustom',
      workouts: 'id, date, name, templateId, completedAt',
      workoutExercises: 'id, workoutId, exerciseId, [workoutId+exerciseId], order',
      sets: 'id, workoutExerciseId, setNumber',
      bodyWeightEntries: 'id, date',
      templates: 'id, name',
      aiSummaries: 'id, workoutId',
    });
  }
}

export const db = new FitLogDB();

export async function initializeDatabase(): Promise<void> {
  const count = await db.exercises.count();
  if (count === 0) {
    await db.exercises.bulkAdd(seedExercises);
    await seedDefaultTemplates();
  }
}

 export async function clearWorkoutData(): Promise<void> {
  await db.sets.clear();
  await db.workoutExercises.clear();
  await db.workouts.clear();
  await db.bodyWeightEntries.clear();
  await db.aiSummaries.clear();
}   

async function seedDefaultTemplates(): Promise<void> {
  const exercises = await db.exercises.toArray();
  const findId = (name: string) => exercises.find(e => e.name.toLowerCase() === name.toLowerCase())?.id || '';

  const templates: Template[] = [
    {
      id: 'tpl-push',
      name: 'Push Day',
      description: 'Chest, shoulders, triceps',
      exercises: [
        { exerciseId: findId('Bench Press'), sets: 4, reps: 8 },
        { exerciseId: findId('Overhead Press'), sets: 3, reps: 10 },
        { exerciseId: findId('Incline Dumbbell Press'), sets: 3, reps: 10 },
        { exerciseId: findId('Lateral Raise'), sets: 3, reps: 15 },
        { exerciseId: findId('Tricep Pushdown'), sets: 3, reps: 12 },
        { exerciseId: findId('Overhead Tricep Extension'), sets: 3, reps: 12 },
      ].filter(e => e.exerciseId)
    },
    {
      id: 'tpl-pull',
      name: 'Pull Day',
      description: 'Back, biceps, rear delts',
      exercises: [
        { exerciseId: findId('Deadlift'), sets: 4, reps: 6 },
        { exerciseId: findId('Barbell Row'), sets: 4, reps: 8 },
        { exerciseId: findId('Lat Pulldown'), sets: 3, reps: 10 },
        { exerciseId: findId('Seated Cable Row'), sets: 3, reps: 10 },
        { exerciseId: findId('Face Pull'), sets: 3, reps: 15 },
        { exerciseId: findId('Barbell Curl'), sets: 3, reps: 12 },
      ].filter(e => e.exerciseId)
    },
    {
      id: 'tpl-legs',
      name: 'Leg Day',
      description: 'Quads, hamstrings, glutes, calves',
      exercises: [
        { exerciseId: findId('Squat'), sets: 4, reps: 8 },
        { exerciseId: findId('Romanian Deadlift'), sets: 3, reps: 10 },
        { exerciseId: findId('Leg Press'), sets: 3, reps: 12 },
        { exerciseId: findId('Leg Curl'), sets: 3, reps: 12 },
        { exerciseId: findId('Leg Extension'), sets: 3, reps: 12 },
        { exerciseId: findId('Calf Raise'), sets: 4, reps: 15 },
      ].filter(e => e.exerciseId)
    },
    {
      id: 'tpl-upper',
      name: 'Upper Body',
      description: 'Full upper body workout',
      exercises: [
        { exerciseId: findId('Bench Press'), sets: 4, reps: 8 },
        { exerciseId: findId('Barbell Row'), sets: 4, reps: 8 },
        { exerciseId: findId('Overhead Press'), sets: 3, reps: 10 },
        { exerciseId: findId('Lat Pulldown'), sets: 3, reps: 10 },
        { exerciseId: findId('Barbell Curl'), sets: 2, reps: 12 },
        { exerciseId: findId('Tricep Pushdown'), sets: 2, reps: 12 },
      ].filter(e => e.exerciseId)
    },
    {
      id: 'tpl-lower',
      name: 'Lower Body',
      description: 'Full lower body workout',
      exercises: [
        { exerciseId: findId('Squat'), sets: 4, reps: 8 },
        { exerciseId: findId('Romanian Deadlift'), sets: 3, reps: 10 },
        { exerciseId: findId('Bulgarian Split Squat'), sets: 3, reps: 10 },
        { exerciseId: findId('Leg Curl'), sets: 3, reps: 12 },
        { exerciseId: findId('Calf Raise'), sets: 4, reps: 15 },
      ].filter(e => e.exerciseId)
    }
  ];

  await db.templates.bulkAdd(templates);
}