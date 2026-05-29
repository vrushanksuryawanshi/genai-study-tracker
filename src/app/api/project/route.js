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

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }

  return NextResponse.json({ projects });
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

  const { id, content, title } = body;

  if (content === undefined) {
    return NextResponse.json(
      { error: "Content field is required" },
      { status: 400 }
    );
  }

  let data;
  let error;

  if (id) {
    // Update existing project
    const result = await supabase
      .from("projects")
      .update({
        content,
        title: title || 'Untitled Project',
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
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
        title: title || 'Untitled Project',
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
