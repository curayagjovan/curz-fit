import type { Exercise, WorkoutSessionStatus } from "@prisma/client";

export type ProgramExerciseDetail = {
  id: string;
  order: number;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number | null;
  notes: string | null;
  exerciseId: string;
  exercise: Exercise;
};

export type ProgramDayDetail = {
  id: string;
  name: string;
  order: number;
  exercises: ProgramExerciseDetail[];
};

export type ProgramDetail = {
  id: string;
  name: string;
  description: string | null;
  days: ProgramDayDetail[];
};

export type ProgramSummary = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  dayCount: number;
  exerciseCount: number;
};

export type SessionSummary = {
  id: string;
  sessionNo: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
  note: string | null;
  programDayName: string | null;
  setCount: number;
};

export type SetLogItem = {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  exerciseName: string;
  exerciseId: string;
};

export type SessionDetail = {
  id: string;
  sessionNo: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
  note: string | null;
  programDayId: string | null;
  sets: SetLogItem[];
  programDay: ProgramDayDetail | null;
};
