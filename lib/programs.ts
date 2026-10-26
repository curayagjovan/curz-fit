import { prisma } from "@/lib/prisma";

export type ProgramExerciseInput = {
  id?: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  targetReps: number;
  targetWeightKg?: number | null;
  notes?: string | null;
};

export type ProgramDayInput = {
  id?: string;
  name: string;
  order: number;
  exercises: ProgramExerciseInput[];
};

export type ProgramInput = {
  name: string;
  description?: string | null;
  days: ProgramDayInput[];
};

export class ProgramValidationError extends Error {}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseProgramExercise(value: unknown): ProgramExerciseInput {
  if (typeof value !== "object" || value === null) {
    throw new ProgramValidationError("Each exercise must be an object");
  }
  const raw = value as Record<string, unknown>;

  if (typeof raw.exerciseId !== "string" || !raw.exerciseId) {
    throw new ProgramValidationError("exerciseId is required");
  }
  if (!isFiniteNumber(raw.order)) {
    throw new ProgramValidationError("order must be a number");
  }
  if (!isFiniteNumber(raw.targetSets) || raw.targetSets <= 0) {
    throw new ProgramValidationError("targetSets must be a positive number");
  }
  if (!isFiniteNumber(raw.targetReps) || raw.targetReps <= 0) {
    throw new ProgramValidationError("targetReps must be a positive number");
  }

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    exerciseId: raw.exerciseId,
    order: raw.order,
    targetSets: raw.targetSets,
    targetReps: raw.targetReps,
    targetWeightKg: isFiniteNumber(raw.targetWeightKg) ? raw.targetWeightKg : null,
    notes: typeof raw.notes === "string" && raw.notes.trim() ? raw.notes.trim() : null,
  };
}

function parseProgramDay(value: unknown): ProgramDayInput {
  if (typeof value !== "object" || value === null) {
    throw new ProgramValidationError("Each day must be an object");
  }
  const raw = value as Record<string, unknown>;

  if (typeof raw.name !== "string" || !raw.name.trim()) {
    throw new ProgramValidationError("Day name is required");
  }
  if (!isFiniteNumber(raw.order)) {
    throw new ProgramValidationError("Day order must be a number");
  }
  if (!Array.isArray(raw.exercises)) {
    throw new ProgramValidationError("Day exercises must be an array");
  }

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    name: raw.name.trim(),
    order: raw.order,
    exercises: raw.exercises.map(parseProgramExercise),
  };
}

export function parseProgramInput(body: unknown): ProgramInput {
  if (typeof body !== "object" || body === null) {
    throw new ProgramValidationError("Request body must be an object");
  }
  const raw = body as Record<string, unknown>;

  if (typeof raw.name !== "string" || !raw.name.trim()) {
    throw new ProgramValidationError("Program name is required");
  }
  if (!Array.isArray(raw.days)) {
    throw new ProgramValidationError("Program days must be an array");
  }

  return {
    name: raw.name.trim(),
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : null,
    days: raw.days.map(parseProgramDay),
  };
}

const programWithDetailsInclude = {
  days: {
    orderBy: { order: "asc" as const },
    include: {
      exercises: {
        orderBy: { order: "asc" as const },
        include: { exercise: true },
      },
    },
  },
};

// Creates a program (programId: null) or applies a full-tree update
// (programId: existing id) in one transaction. Days/exercises carrying an
// `id` are updated in place; those without one are created; anything that
// existed before but isn't present in `input` anymore is deleted. This lets
// the program editor UI hold one local draft tree and save it in a single
// call instead of issuing granular CRUD requests per day/exercise.
export async function saveProgram(
  ownerId: string,
  programId: string | null,
  input: ProgramInput,
) {
  return prisma.$transaction(async (tx) => {
    const program = programId
      ? await tx.program.update({
          where: { id: programId },
          data: { name: input.name, description: input.description },
        })
      : await tx.program.create({
          data: { name: input.name, description: input.description, ownerId },
        });

    if (programId) {
      const incomingDayIds = new Set(
        input.days.filter((day) => day.id).map((day) => day.id as string),
      );
      const existingDays = await tx.programDay.findMany({
        where: { programId },
        select: { id: true },
      });
      const dayIdsToDelete = existingDays
        .map((day) => day.id)
        .filter((id) => !incomingDayIds.has(id));
      if (dayIdsToDelete.length > 0) {
        await tx.programDay.deleteMany({ where: { id: { in: dayIdsToDelete } } });
      }
    }

    for (const day of input.days) {
      const dayRecord = day.id
        ? await tx.programDay.update({
            where: { id: day.id },
            data: { name: day.name, order: day.order },
          })
        : await tx.programDay.create({
            data: { name: day.name, order: day.order, programId: program.id },
          });

      if (day.id) {
        const incomingExerciseIds = new Set(
          day.exercises.filter((exercise) => exercise.id).map((exercise) => exercise.id as string),
        );
        const existingExercises = await tx.programExercise.findMany({
          where: { programDayId: dayRecord.id },
          select: { id: true },
        });
        const exerciseIdsToDelete = existingExercises
          .map((exercise) => exercise.id)
          .filter((id) => !incomingExerciseIds.has(id));
        if (exerciseIdsToDelete.length > 0) {
          await tx.programExercise.deleteMany({
            where: { id: { in: exerciseIdsToDelete } },
          });
        }
      }

      for (const exercise of day.exercises) {
        const data = {
          exerciseId: exercise.exerciseId,
          order: exercise.order,
          targetSets: exercise.targetSets,
          targetReps: exercise.targetReps,
          targetWeightKg: exercise.targetWeightKg,
          notes: exercise.notes,
        };

        if (exercise.id) {
          await tx.programExercise.update({ where: { id: exercise.id }, data });
        } else {
          await tx.programExercise.create({
            data: { ...data, programDayId: dayRecord.id },
          });
        }
      }
    }

    return tx.program.findUniqueOrThrow({
      where: { id: program.id },
      include: programWithDetailsInclude,
    });
  });
}

export async function getProgramWithDetails(id: string) {
  return prisma.program.findUnique({
    where: { id },
    include: programWithDetailsInclude,
  });
}

type ProgramWithDetails = NonNullable<
  Awaited<ReturnType<typeof getProgramWithDetails>>
>;

// Prisma's Decimal serializes to a JSON string (via its own toJSON), not a
// number — left alone, the client would get `targetWeightKg: "62.50"` and
// have to parse it before doing any math. Converting here keeps every
// consumer of this shape working with plain numbers. Shared (not just used
// by serializeProgram below) because the session-detail route also returns
// nested ProgramExercise records with the same field.
export function serializeProgramExercise<T extends { targetWeightKg: unknown }>(
  exercise: T,
): Omit<T, "targetWeightKg"> & { targetWeightKg: number | null } {
  return {
    ...exercise,
    targetWeightKg:
      exercise.targetWeightKg === null ? null : Number(exercise.targetWeightKg),
  };
}

export function serializeProgram(program: ProgramWithDetails) {
  return {
    ...program,
    days: program.days.map((day) => ({
      ...day,
      exercises: day.exercises.map(serializeProgramExercise),
    })),
  };
}
