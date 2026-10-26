import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { serializeSetLog } from "@/lib/sessions";

type RouteParams = { params: Promise<{ id: string }> };

type AddSetPayload = {
  exerciseId?: string;
  setNumber?: number;
  reps?: number;
  weightKg?: number;
};

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id },
    select: { memberId: true },
  });
  if (!session || session.memberId !== auth.appUser.id) {
    return NextResponse.json({ message: "Session not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as AddSetPayload;

    if (!body.exerciseId) {
      return NextResponse.json({ message: "exerciseId is required" }, { status: 400 });
    }
    if (
      typeof body.setNumber !== "number" ||
      typeof body.reps !== "number" ||
      typeof body.weightKg !== "number"
    ) {
      return NextResponse.json(
        { message: "setNumber, reps, and weightKg are required" },
        { status: 400 },
      );
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: body.exerciseId },
      select: { name: true },
    });
    if (!exercise) {
      return NextResponse.json({ message: "Exercise not found" }, { status: 404 });
    }

    const setLog = await prisma.workoutSetLog.create({
      data: {
        sessionId: id,
        exerciseId: body.exerciseId,
        exerciseName: exercise.name,
        setNumber: body.setNumber,
        reps: body.reps,
        weightKg: body.weightKg,
      },
    });

    return NextResponse.json(serializeSetLog(setLog), { status: 201 });
  } catch (error) {
    console.error("Failed to log set", error);
    return NextResponse.json({ message: "Unable to log set" }, { status: 500 });
  }
}
