import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import {
  ProgramValidationError,
  parseProgramInput,
  saveProgram,
  serializeProgram,
} from "@/lib/programs";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const programs = await prisma.program.findMany({
      where: { ownerId: auth.appUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        days: { select: { id: true, exercises: { select: { id: true } } } },
      },
    });

    const summaries = programs.map((program) => ({
      id: program.id,
      name: program.name,
      description: program.description,
      updatedAt: program.updatedAt,
      dayCount: program.days.length,
      exerciseCount: program.days.reduce(
        (total, day) => total + day.exercises.length,
        0,
      ),
    }));

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Failed to load programs", error);
    return NextResponse.json(
      { message: "Unable to load programs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const input = parseProgramInput(body);
    const program = await saveProgram(auth.appUser.id, null, input);
    return NextResponse.json(serializeProgram(program), { status: 201 });
  } catch (error) {
    if (error instanceof ProgramValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Failed to create program", error);
    return NextResponse.json(
      { message: "Unable to create program" },
      { status: 500 },
    );
  }
}
