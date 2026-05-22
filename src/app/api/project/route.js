import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // If no project row exists yet, return empty content
    if (error.code === "PGRST116") {
      return NextResponse.json({ project: { content: "", updated_at: null } });
    }
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }

  return NextResponse.json({ project });
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

  const { content } = body;

  if (content === undefined) {
    return NextResponse.json(
      { error: "Content field is required" },
      { status: 400 }
    );
  }

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let data;
  let error;

  if (existing) {
    // Update existing project
    const result = await supabase
      .from("projects")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    data = result.data;
    error = result.error;
  } else {
    // Insert new project
    const result = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        content,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    data = result.data;
    error = result.error;
  }

  if (error) {
    return NextResponse.json(
      { error: "Failed to save project" },
      { status: 500 }
    );
  }

  return NextResponse.json({ project: data });
}
