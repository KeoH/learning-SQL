import { NextResponse } from "next/server";
import { getSessionContent } from "@/lib/markdown";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const content = getSessionContent(id);
  // We can return raw markdown, or maybe parsed.
  // Returning raw text content is fine, frontend can parse or just display.
  // But wait, the frontend needs to show "chat bubbles".
  // Storing as markdown is great for "files", but parsing it back to structured "chat" might be tricky if we just dump markdown.
  // However, I used specific headers: `## Query` and `## Result` and `## Error`.
  // So I can parse that on the client or here.
  // Let's return the raw content for now, and I'll write a simple parser on the client.
  // Actually, maybe returning JSON structure is better if I want to render them beautifully.
  // But the requirement said "recover" the conversation.
  // Let's stick to returning raw content and let the client parse it. It's more resilient if the user edits the file manually.
  return NextResponse.json({ content });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { deleteSession, deleteSessionNote } = await import("@/lib/markdown");

  // Parse query params for index
  const url = new URL(request.url);
  const indexParam = url.searchParams.get("index");

  try {
    if (indexParam !== null) {
      // Delete specific note
      const index = parseInt(indexParam, 10);
      if (isNaN(index)) {
        return NextResponse.json({ error: "Invalid index" }, { status: 400 });
      }
      deleteSessionNote(id, index);
      return NextResponse.json({ success: true });
    } else {
      // Delete entire session
      deleteSession(id);
      return NextResponse.json({ success: true });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, index, content } = body;
  const { updateSessionTitle, updateSessionNote } = await import(
    "@/lib/markdown"
  );

  try {
    if (name) {
      updateSessionTitle(id, name);
      return NextResponse.json({ success: true });
    }

    if (typeof index === "number" && content !== undefined) {
      updateSessionNote(id, index, content);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid request parameters" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { type, content } = await request.json();
  const { appendToSession } = await import("@/lib/markdown");

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  try {
    appendToSession(id, type || "note", content);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
