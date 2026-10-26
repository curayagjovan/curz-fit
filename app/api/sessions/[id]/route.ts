import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { serializeProgramExercise } from "@/lib/programs";
import { serializeSetLog } from "@/lib/sessions";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id },
    include: {
      sets: { orderBy: { setNumber: "asc" } },
      programDay: {
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });

  if (!session || session.memberId !== auth.appUser.id) {
    return NextResponse.json({ message: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...session,
    sets: session.sets.map(serializeSetLog),
    programDay: session.programDay
      ? {
          ...session.programDay,
          exercises: session.programDay.exercises.map(serializeProgramExercise),
        }
      : null,
  });
}

type UpdateSessionPayload = {
  status?: "COMPLETED" | "CANCELLED";
  note?: string;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const existing = await prisma.workoutSession.findUnique({
    where: { id },
    select: { memberId: true },
  });
  if (!existing || existing.memberId !== auth.appUser.id) {
    return NextResponse.json({ message: "Session not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as UpdateSessionPayload;

    if (body.status && body.status !== "COMPLETED" && body.status !== "CANCELLED") {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const session = await prisma.workoutSession.update({
      where: { id },
      data: {
        ...(body.status
          ? { status: body.status, completedAt: new Date() }
          : {}),
        ...(body.note !== undefined ? { note: body.note.trim() || null } : {}),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to update session", error);
    return NextResponse.json(
      { message: "Unable to update session" },
      { status: 500 },
    );
  }
}
