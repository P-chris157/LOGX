import type { Exercise } from '../types';
import { v4 as uuid } from 'uuid';

export const seedExercises: Exercise[] = [
  // Chest
  { id: uuid(), name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Incline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Decline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Dumbbell Bench Press', muscleGroup: 'Chest', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Dumbbell Fly', muscleGroup: 'Chest', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Cable Fly', muscleGroup: 'Chest', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Push Up', muscleGroup: 'Chest', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Chest Dip', muscleGroup: 'Chest', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Machine Chest Press', muscleGroup: 'Chest', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Pec Deck', muscleGroup: 'Chest', equipment: 'Machine', isCustom: false },
  
  // Back
  { id: uuid(), name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Pendlay Row', muscleGroup: 'Back', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Pull Up', muscleGroup: 'Back', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Chin Up', muscleGroup: 'Back', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Seated Cable Row', muscleGroup: 'Back', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Face Pull', muscleGroup: 'Back', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Straight Arm Pulldown', muscleGroup: 'Back', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Rack Pull', muscleGroup: 'Back', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Good Morning', muscleGroup: 'Back', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Hyperextension', muscleGroup: 'Back', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Machine Row', muscleGroup: 'Back', equipment: 'Machine', isCustom: false },
  
  // Shoulders
  { id: uuid(), name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Push Press', muscleGroup: 'Shoulders', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Lateral Raise', muscleGroup: 'Shoulders', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Front Raise', muscleGroup: 'Shoulders', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Rear Delt Fly', muscleGroup: 'Shoulders', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Upright Row', muscleGroup: 'Shoulders', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Machine Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Shrug', muscleGroup: 'Shoulders', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Dumbbell Shrug', muscleGroup: 'Shoulders', equipment: 'Dumbbell', isCustom: false },
  
  // Legs - Quads
  { id: uuid(), name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Front Squat', muscleGroup: 'Legs', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Hack Squat', muscleGroup: 'Legs', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Leg Extension', muscleGroup: 'Legs', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Goblet Squat', muscleGroup: 'Legs', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Bulgarian Split Squat', muscleGroup: 'Legs', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Lunge', muscleGroup: 'Legs', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Walking Lunge', muscleGroup: 'Legs', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Step Up', muscleGroup: 'Legs', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Sissy Squat', muscleGroup: 'Legs', equipment: 'Bodyweight', isCustom: false },
  
  // Legs - Hamstrings
  { id: uuid(), name: 'Romanian Deadlift', muscleGroup: 'Legs', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Stiff Leg Deadlift', muscleGroup: 'Legs', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Leg Curl', muscleGroup: 'Legs', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Seated Leg Curl', muscleGroup: 'Legs', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Nordic Curl', muscleGroup: 'Legs', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Glute Ham Raise', muscleGroup: 'Legs', equipment: 'Machine', isCustom: false },
  
  // Legs - Glutes
  { id: uuid(), name: 'Hip Thrust', muscleGroup: 'Glutes', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Glute Bridge', muscleGroup: 'Glutes', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Cable Pull Through', muscleGroup: 'Glutes', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Kickback', muscleGroup: 'Glutes', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Sumo Deadlift', muscleGroup: 'Glutes', equipment: 'Barbell', isCustom: false },
  
  // Legs - Calves
  { id: uuid(), name: 'Calf Raise', muscleGroup: 'Calves', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Seated Calf Raise', muscleGroup: 'Calves', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Standing Calf Raise', muscleGroup: 'Calves', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Donkey Calf Raise', muscleGroup: 'Calves', equipment: 'Machine', isCustom: false },
  
  // Biceps
  { id: uuid(), name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'EZ Bar Curl', muscleGroup: 'Biceps', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Preacher Curl', muscleGroup: 'Biceps', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Concentration Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Spider Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Machine Curl', muscleGroup: 'Biceps', equipment: 'Machine', isCustom: false },
  
  // Triceps
  { id: uuid(), name: 'Close Grip Bench Press', muscleGroup: 'Triceps', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Skull Crusher', muscleGroup: 'Triceps', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Tricep Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Rope Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Dumbbell Kickback', muscleGroup: 'Triceps', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Tricep Dip', muscleGroup: 'Triceps', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Diamond Push Up', muscleGroup: 'Triceps', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'JM Press', muscleGroup: 'Triceps', equipment: 'Barbell', isCustom: false },
  
  // Core
  { id: uuid(), name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Side Plank', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Crunch', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Sit Up', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Leg Raise', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Hanging Leg Raise', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Ab Wheel Rollout', muscleGroup: 'Core', equipment: 'Other', isCustom: false },
  { id: uuid(), name: 'Cable Crunch', muscleGroup: 'Core', equipment: 'Cable', isCustom: false },
  { id: uuid(), name: 'Russian Twist', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Dead Bug', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Bird Dog', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Mountain Climber', muscleGroup: 'Core', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Pallof Press', muscleGroup: 'Core', equipment: 'Cable', isCustom: false },
  
  // Forearms
  { id: uuid(), name: 'Wrist Curl', muscleGroup: 'Forearms', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Reverse Wrist Curl', muscleGroup: 'Forearms', equipment: 'Barbell', isCustom: false },
  { id: uuid(), name: 'Farmers Walk', muscleGroup: 'Forearms', equipment: 'Dumbbell', isCustom: false },
  { id: uuid(), name: 'Plate Pinch', muscleGroup: 'Forearms', equipment: 'Other', isCustom: false },
  
  // Cardio
  { id: uuid(), name: 'Treadmill Run', muscleGroup: 'Cardio', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Stationary Bike', muscleGroup: 'Cardio', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Rowing Machine', muscleGroup: 'Cardio', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Stair Climber', muscleGroup: 'Cardio', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Elliptical', muscleGroup: 'Cardio', equipment: 'Machine', isCustom: false },
  { id: uuid(), name: 'Jump Rope', muscleGroup: 'Cardio', equipment: 'Other', isCustom: false },
  { id: uuid(), name: 'Burpee', muscleGroup: 'Cardio', equipment: 'Bodyweight', isCustom: false },
  { id: uuid(), name: 'Box Jump', muscleGroup: 'Cardio', equipment: 'Other', isCustom: false },
  { id: uuid(), name: 'Battle Ropes', muscleGroup: 'Cardio', equipment: 'Other', isCustom: false },
];
