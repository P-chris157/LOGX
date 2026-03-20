import { db } from '../db/database';
import type { Workout, WorkoutExercise, WorkoutSet, BodyWeightEntry, Template, Exercise, AISummary } from '../types';

interface ExportData {
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  sets: WorkoutSet[];
  bodyWeightEntries: BodyWeightEntry[];
  templates: Template[];
  aiSummaries: AISummary[];
}

export async function exportAllData(): Promise<string> {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: await db.exercises.filter(e => e.isCustom).toArray(),
    workouts: await db.workouts.toArray(),
    workoutExercises: await db.workoutExercises.toArray(),
    sets: await db.sets.toArray(),
    bodyWeightEntries: await db.bodyWeightEntries.toArray(),
    templates: await db.templates.toArray(),
    aiSummaries: await db.aiSummaries.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data: ExportData = JSON.parse(jsonString);
    
    if (!data.version || !data.exportedAt) {
      return { success: false, message: 'Invalid backup file format' };
    }

    // Clear existing user data (keep default exercises)
    await db.workouts.clear();
    await db.workoutExercises.clear();
    await db.sets.clear();
    await db.bodyWeightEntries.clear();
    await db.aiSummaries.clear();
    
    // Import custom exercises
    if (data.exercises?.length > 0) {
      for (const exercise of data.exercises) {
        const exists = await db.exercises.get(exercise.id);
        if (!exists) {
          await db.exercises.add(exercise);
        }
      }
    }

    // Import other data
    if (data.workouts?.length > 0) await db.workouts.bulkAdd(data.workouts);
    if (data.workoutExercises?.length > 0) await db.workoutExercises.bulkAdd(data.workoutExercises);
    if (data.sets?.length > 0) await db.sets.bulkAdd(data.sets);
    if (data.bodyWeightEntries?.length > 0) await db.bodyWeightEntries.bulkAdd(data.bodyWeightEntries);
    if (data.aiSummaries?.length > 0) await db.aiSummaries.bulkAdd(data.aiSummaries);
    
    // Import templates (replace existing)
    if (data.templates?.length > 0) {
      await db.templates.clear();
      await db.templates.bulkAdd(data.templates);
    }

    return { success: true, message: `Imported ${data.workouts?.length || 0} workouts successfully` };
  } catch (e) {
    console.error('Import error:', e);
    return { success: false, message: 'Failed to parse backup file' };
  }
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
