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

  const { data: tools, error } = await supabase
    .from("tools")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch tools" },
      { status: 500 }
    );
  }

  return NextResponse.json({ tools });
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

  const { name, category, status, logo_url } = body;

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Tool name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tools")
    .insert({
      user_id: user.id,
      name: name.trim(),
      category: category || "General",
      status: status || "remaining",
      logo_url: logo_url || "",
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase tool insert error:", error);
    return NextResponse.json(
      { error: "Failed to create tool", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ tool: data }, { status: 201 });
}
