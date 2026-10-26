import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import {
  ProgramValidationError,
  getProgramWithDetails,
  parseProgramInput,
  saveProgram,
  serializeProgram,
} from "@/lib/programs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const program = await getProgramWithDetails(id);

  if (!program || program.ownerId !== auth.appUser.id) {
    return NextResponse.json({ message: "Program not found" }, { status: 404 });
  }

  return NextResponse.json(serializeProgram(program));
}

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const existing = await prisma.program.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing || existing.ownerId !== auth.appUser.id) {
    return NextResponse.json({ message: "Program not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const input = parseProgramInput(body);
    const program = await saveProgram(auth.appUser.id, id, input);
    return NextResponse.json(serializeProgram(program));
  } catch (error) {
    if (error instanceof ProgramValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Failed to update program", error);
    return NextResponse.json(
      { message: "Unable to update program" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  const existing = await prisma.program.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing || existing.ownerId !== auth.appUser.id) {
    return NextResponse.json({ message: "Program not found" }, { status: 404 });
  }

  try {
    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete program", error);
    return NextResponse.json(
      { message: "Unable to delete program" },
      { status: 500 },
    );
  }
}
