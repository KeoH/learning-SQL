import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const dbs = await query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
    );

    return NextResponse.json(dbs.rows.map((row) => row.datname));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
