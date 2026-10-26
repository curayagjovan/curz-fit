import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const exercises = await prisma.exercise.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Failed to load exercises", error);
    return NextResponse.json(
      { message: "Unable to load exercises" },
      { status: 500 },
    );
  }
}
