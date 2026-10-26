// WorkoutSetLog.weightKg is a Prisma Decimal — same JSON-string gotcha as
// ProgramExercise.targetWeightKg (see serializeProgramExercise in
// lib/programs.ts). Converting here keeps the client working with plain
// numbers instead of parsing strings before every calculation.
export function serializeSetLog<T extends { weightKg: unknown }>(
  setLog: T,
): Omit<T, "weightKg"> & { weightKg: number } {
  return {
    ...setLog,
    weightKg: Number(setLog.weightKg),
  };
}
