import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { appendToSession, getSessionDatabase } from "@/lib/markdown";

// Helper to format rows as Markdown table
// Helper to format rows as Markdown table
function formatTable(rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) return "_No results_";

  const columns = Object.keys(rows[0]);
  const header = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows
    .map((row) => {
      return `| ${columns
        .map((col) => {
          const val = row[col];
          if (val === null) return "NULL";
          if (typeof val === "object" && !(val instanceof Date)) {
            return JSON.stringify(val).replace(/\|/g, "\\|");
          }
          return String(val).replace(/\|/g, "\\|");
        })
        .join(" | ")} |`;
    })
    .join("\n");

  return `${header}\n${separator}\n${body}`;
}

export async function POST(request: Request) {
  try {
    const { sql, sessionId } = await request.json();

    if (!sql || !sessionId) {
      return NextResponse.json(
        { error: "Missing sql or sessionId" },
        { status: 400 }
      );
    }

    // Append Query to history
    appendToSession(sessionId, "query", sql);

    // Execute Query
    let resultRows: Record<string, unknown>[] = [];
    let rowCount = 0;
    try {
      const database = getSessionDatabase(sessionId);
      const res = await query(sql, [], database);
      // For some queries like INSERT/UPDATE, rows might be empty butrowCount is set.
      // But query returns a Result object.
      // Wait, my `query` wrapper returns the promise from pool.query
      // which resolves to QueryResult.

      if (Array.isArray(res)) {
        // multi-query support? pg might return array if multiple queries.
        // For now assume single query.
        resultRows = res[0].rows;
        rowCount = res[0].rowCount || 0;
      } else {
        resultRows = res.rows;
        rowCount = res.rowCount || 0;
      }

      // Format result
      let markdownResult = "";
      if (resultRows.length > 0) {
        markdownResult = formatTable(resultRows);
      } else {
        markdownResult = `_Query executed successfully. Rows affected: ${rowCount}_`;
      }

      appendToSession(sessionId, "result", markdownResult);

      return NextResponse.json({
        success: true,
        rows: resultRows,
        rowCount,
        markdown: markdownResult,
      });
    } catch (dbError: unknown) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      appendToSession(sessionId, "error", errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
