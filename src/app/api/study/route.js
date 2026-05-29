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

  // Fetch user settings
  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (settingsError) {
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }

  // Fetch all study sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (sessionsError) {
    return NextResponse.json(
      { error: "Failed to fetch study sessions" },
      { status: 500 }
    );
  }

  // Compute stats
  const uniqueDates = new Set(sessions.map((s) => s.date));
  const totalDaysStudied = uniqueDates.size;

  const doubleCreditDays = sessions.filter((s) => s.is_double_credit).length;
  const turboCreditDays = sessions.filter((s) => s.is_turbo_credit).length;

  const totalSeconds = sessions.reduce(
    (sum, s) => sum + (s.duration_seconds || 0),
    0
  );
  const totalHours = parseFloat((totalSeconds / 3600).toFixed(2));

  // Calculate lives used: count past days from start_date to today with no session
  const startDate = new Date(settings.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  let livesUsed = 0;
  if (today >= startDate) {
    const current = new Date(startDate);
    while (current < today) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      if (!uniqueDates.has(dateStr)) {
        livesUsed++;
      }
      current.setDate(current.getDate() + 1);
    }
  }

  const totalLivesCalculated = settings.max_lives - livesUsed + doubleCreditDays + (turboCreditDays * 2);
  const totalLivesPositive = Math.max(totalLivesCalculated, 0);
  
  const livesRemaining = Math.min(totalLivesPositive, settings.max_lives);
  const overcharge = Math.max(totalLivesPositive - settings.max_lives, 0);

  // Calculate current streak: consecutive days ending today or yesterday
  let currentStreak = 0;
  const sortedDates = Array.from(uniqueDates).sort().reverse();

  if (sortedDates.length > 0) {
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Streak must start from today or yesterday
    if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
      let checkDate = new Date(sortedDates[0]);
      for (const dateStr of sortedDates) {
        const checkYear = checkDate.getFullYear();
        const checkMonth = String(checkDate.getMonth() + 1).padStart(2, '0');
        const checkDay = String(checkDate.getDate()).padStart(2, '0');
        const checkStr = `${checkYear}-${checkMonth}-${checkDay}`;
        
        if (dateStr === checkStr) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  return NextResponse.json({
    sessions,
    stats: {
      totalDaysStudied,
      doubleCreditDays,
      turboCreditDays,
      livesUsed,
      livesRemaining,
      overcharge,
      totalHours,
      currentStreak,
      startDate: settings.start_date,
      totalDays: settings.total_days,
      maxLives: settings.max_lives,
    },
  });
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

  const { date, duration_seconds, is_double_credit, is_turbo_credit } = body;

  if (!date) {
    return NextResponse.json(
      { error: "Date is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      user_id: user.id,
      date,
      duration_seconds: duration_seconds ?? 10800,
      is_double_credit: is_double_credit ?? false,
      is_turbo_credit: is_turbo_credit ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create study session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ session: data }, { status: 201 });
}
