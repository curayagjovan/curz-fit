import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";

function generateSessionNo() {
  return `WK-${Date.now().toString(36).toUpperCase()}`;
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const sessions = await prisma.workoutSession.findMany({
      where: { memberId: auth.appUser.id },
      orderBy: { startedAt: "desc" },
      include: {
        programDay: { select: { name: true } },
        _count: { select: { sets: true } },
      },
    });

    const summaries = sessions.map((session) => ({
      id: session.id,
      sessionNo: session.sessionNo,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      note: session.note,
      programDayName: session.programDay?.name ?? null,
      setCount: session._count.sets,
    }));

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Failed to load sessions", error);
    return NextResponse.json(
      { message: "Unable to load sessions" },
      { status: 500 },
    );
  }
}

type StartSessionPayload = {
  programDayId?: string;
  note?: string;
};

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as StartSessionPayload;

    if (body.programDayId) {
      const programDay = await prisma.programDay.findUnique({
        where: { id: body.programDayId },
        select: { program: { select: { ownerId: true } } },
      });

      if (!programDay || programDay.program.ownerId !== auth.appUser.id) {
        return NextResponse.json(
          { message: "Program day not found" },
          { status: 404 },
        );
      }
    }

    const session = await prisma.workoutSession.create({
      data: {
        sessionNo: generateSessionNo(),
        memberId: auth.appUser.id,
        programDayId: body.programDayId ?? null,
        note: body.note?.trim() || null,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Failed to start session", error);
    return NextResponse.json(
      { message: "Unable to start session" },
      { status: 500 },
    );
  }
}
