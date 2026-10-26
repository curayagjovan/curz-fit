import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { serializeSetLog } from "@/lib/sessions";

type RouteParams = { params: Promise<{ id: string; setId: string }> };

async function loadOwnedSet(sessionId: string, setId: string, memberId: string) {
  const setLog = await prisma.workoutSetLog.findUnique({
    where: { id: setId },
    include: { session: { select: { id: true, memberId: true } } },
  });

  if (!setLog || setLog.session.id !== sessionId || setLog.session.memberId !== memberId) {
    return null;
  }

  return setLog;
}

type UpdateSetPayload = {
  reps?: number;
  weightKg?: number;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id, setId } = await params;
  const existing = await loadOwnedSet(id, setId, auth.appUser.id);
  if (!existing) {
    return NextResponse.json({ message: "Set not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as UpdateSetPayload;
    const setLog = await prisma.workoutSetLog.update({
      where: { id: setId },
      data: {
        ...(typeof body.reps === "number" ? { reps: body.reps } : {}),
        ...(typeof body.weightKg === "number" ? { weightKg: body.weightKg } : {}),
      },
    });

    return NextResponse.json(serializeSetLog(setLog));
  } catch (error) {
    console.error("Failed to update set", error);
    return NextResponse.json({ message: "Unable to update set" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id, setId } = await params;
  const existing = await loadOwnedSet(id, setId, auth.appUser.id);
  if (!existing) {
    return NextResponse.json({ message: "Set not found" }, { status: 404 });
  }

  try {
    await prisma.workoutSetLog.delete({ where: { id: setId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete set", error);
    return NextResponse.json({ message: "Unable to delete set" }, { status: 500 });
  }
}
