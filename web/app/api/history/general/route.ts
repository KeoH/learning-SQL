import { NextResponse } from "next/server";
import {
  getSessionContent,
  appendToSession,
  deleteSessionNote,
} from "@/lib/markdown";

const GENERAL_QUERIES_ID = "_general_queries";

export async function GET() {
  try {
    const content = getSessionContent(GENERAL_QUERIES_ID);
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }
    appendToSession(GENERAL_QUERIES_ID, type || "saved-query", content);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const indexParam = url.searchParams.get("index");

  try {
    if (indexParam === null) {
      return NextResponse.json({ error: "Index is required" }, { status: 400 });
    }

    const index = parseInt(indexParam, 10);
    if (isNaN(index)) {
      return NextResponse.json({ error: "Invalid index" }, { status: 400 });
    }

    deleteSessionNote(GENERAL_QUERIES_ID, index);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
