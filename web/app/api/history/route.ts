import { NextResponse } from "next/server";
import { getSessions, createSession } from "@/lib/markdown";

export async function GET() {
  const sessions = getSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  try {
    const { name, database } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const id = createSession(name, database);
    return NextResponse.json({ id });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
