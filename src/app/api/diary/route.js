import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for date query param
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  let query = supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (date) {
    query = query.eq("date", date);
  }

  const { data: entries, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch diary entries" },
      { status: 500 }
    );
  }

  return NextResponse.json({ entries });
}

export async function POST(request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { date, content, hours_studied } = body;

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  // Upsert — insert or update if entry for this date already exists
  const { data, error } = await supabase
    .from("diary_entries")
    .upsert(
      {
        user_id: user.id,
        date,
        content: content ?? "",
        hours_studied: hours_studied ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (error) {
    console.error("Diary upsert error:", error);
    return NextResponse.json(
      { error: "Failed to save diary entry", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ entry: data });
}
