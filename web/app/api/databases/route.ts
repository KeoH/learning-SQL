import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      "SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';"
    );
    // including postgres might be useful for admin stuff, but let's stick to user DBS. 
    // Wait, the plan said "list all non-template databases". 
    // And "Verify the result is 'postgres' (or whatever was selected)".
    // So I should probably include postgres or at least don't exclude it explicitly if I want to test with it.
    // Let's just exclude templates.
    
    const dbs = await query(
        "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
    );

    return NextResponse.json(dbs.rows.map(row => row.datname));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
