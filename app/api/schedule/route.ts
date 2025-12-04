import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("schedule_events")
            .select("*")
            .eq("user_id", user.id)
            .order("datetime", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ events: data });
    } catch (error) {
        console.error("Schedule fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch schedules" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, datetime, location, description } = body;

        if (!title || !datetime) {
            return NextResponse.json(
                { error: "Title and datetime are required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("schedule_events")
            .insert({
                user_id: user.id,
                title,
                datetime,
                location: location || null,
                description: description || null,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ event: data });
    } catch (error) {
        console.error("Schedule create error:", error);
        return NextResponse.json(
            { error: "Failed to create schedule" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("schedule_events")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Schedule delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete schedule" },
            { status: 500 }
        );
    }
}
