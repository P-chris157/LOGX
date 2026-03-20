import { db } from '../db/database';
import { v4 as uuid } from 'uuid';

function normalizeLine(line: string): string {
  return line
    .replace(/[–—]/g, '-')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function isSetLine(line: string): boolean {
  return /^(\d+(\.\d+)?)\s*x\s*(\d+)$/.test(line.toLowerCase());
}

function parseSetLine(line: string) {
  const match = line.toLowerCase().match(/^(\d+(\.\d+)?)\s*x\s*(\d+)$/);
  if (!match) return null;

  return {
    weight: parseFloat(match[1]),
    reps: parseInt(match[3], 10)
  };
}

function isWorkoutHeader(line: string): boolean {
  const lower = line.toLowerCase();
  return /^day\s+\d+/.test(lower);
}

function parseWorkoutHeader(line: string) {
  const cleaned = normalizeLine(line);
  const parts = cleaned.split('-').map(p => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    return {
      name: cleaned,
      dateText: parts[1]
    };
  }

  return {
    name: cleaned,
    dateText: null
  };
}

function parseDateFromHeader(dateText: string | null): string {
  if (!dateText) {
    return new Date().toISOString().split('T')[0];
  }

  const year = new Date().getFullYear();
  const parsed = new Date(`${dateText}, ${year}`);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return parsed.toISOString().split('T')[0];
}

async function findOrCreateExercise(name: string) {
  const normalized = name.trim().toLowerCase();

  let exercise = await db.exercises
    .filter(e => e.name.trim().toLowerCase() === normalized)
    .first();

  if (exercise) return exercise;

  exercise = {
    id: uuid(),
    name: name.trim(),
    muscleGroup: 'Other',
    equipment: 'Other',
    isCustom: true
  };

  await db.exercises.add(exercise);
  return exercise;
}

export async function importWorkoutFromText(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  if (lines.length === 0) {
    return { success: false, message: 'No text found to import.' };
  }

  let importedWorkoutCount = 0;
  let currentWorkoutId: string | null = null;
  let currentExerciseBlockId: string | null = null;
  let currentWorkoutOrder = 0;

  for (const line of lines) {
    if (isWorkoutHeader(line)) {
      const { name, dateText } = parseWorkoutHeader(line);

      currentWorkoutId = uuid();
      currentExerciseBlockId = null;
      currentWorkoutOrder = 0;

      await db.workouts.add({
        id: currentWorkoutId,
        name,
        date: parseDateFromHeader(dateText),
        completedAt: new Date().toISOString()
      });

      importedWorkoutCount++;
      continue;
    }

    if (!currentWorkoutId) {
      currentWorkoutId = uuid();
      currentExerciseBlockId = null;
      currentWorkoutOrder = 0;

      await db.workouts.add({
        id: currentWorkoutId,
        name: 'Imported Workout',
        date: new Date().toISOString().split('T')[0],
        completedAt: new Date().toISOString()
      });

      importedWorkoutCount++;
    }

    if (isSetLine(line)) {
      if (!currentExerciseBlockId) {
        continue;
      }

      const parsed = parseSetLine(line);
      if (!parsed) continue;

      const existingCount = await db.sets
        .where('workoutExerciseId')
        .equals(currentExerciseBlockId)
        .count();

      await db.sets.add({
        id: uuid(),
        workoutExerciseId: currentExerciseBlockId,
        setNumber: existingCount + 1,
        weight: parsed.weight,
        reps: parsed.reps,
        completedAt: new Date().toISOString()
      });

      continue;
    }

    const exercise = await findOrCreateExercise(line);

    currentExerciseBlockId = uuid();

    await db.workoutExercises.add({
      id: currentExerciseBlockId,
      workoutId: currentWorkoutId,
      exerciseId: exercise.id,
      order: currentWorkoutOrder
    });

    currentWorkoutOrder++;
  }

  if (importedWorkoutCount === 0) {
    return { success: false, message: 'Could not detect any workouts.' };
  }

  return {
    success: true,
    message: `Imported ${importedWorkoutCount} workout${importedWorkoutCount === 1 ? '' : 's'}.`
  };
}