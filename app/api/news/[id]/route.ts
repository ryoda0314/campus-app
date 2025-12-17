import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UpdateNewsPostRequest } from "@/lib/types/news";

// GET /api/news/[id] - Get news detail
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "campus";

    if (type === "campus") {
        const { data, error } = await supabase
            .from("news_posts")
            .select(`
                *,
                author:profiles!author_id(id, display_name, avatar_url)
            `)
            .eq("id", id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(data);
    } else if (type === "digest") {
        const lang = searchParams.get("lang") || "jp";

        const { data, error } = await supabase
            .from("digest_items")
            .select(`
                *,
                summary:digest_summaries(*)
            `)
            .eq("id", id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Filter summary by lang
        const summary = data.summary?.find((s: { lang: string }) => s.lang === lang);

        return NextResponse.json({ ...data, summary });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// PATCH /api/news/[id] - Update campus news
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing post (RLS will ensure only author can access for update)
    const { data: existing, error: fetchError } = await supabase
        .from("news_posts")
        .select("author_id")
        .eq("id", id)
        .single();

    if (fetchError || !existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.author_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: UpdateNewsPostRequest = await req.json();

    // Whitelist allowed fields
    const updateData: Partial<UpdateNewsPostRequest> = {};
    if (body.title !== undefined) {
        if (body.title.length > 120) {
            return NextResponse.json({ error: "Title too long" }, { status: 400 });
        }
        updateData.title = body.title;
    }
    if (body.body !== undefined) updateData.body = body.body;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.room_id !== undefined) updateData.room_id = body.room_id;
    if (body.pinned_until !== undefined) updateData.pinned_until = body.pinned_until;
    if (body.expires_at !== undefined) updateData.expires_at = body.expires_at;

    const { data, error } = await supabase
        .from("news_posts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE /api/news/[id] - Delete campus news
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing post
    const { data: existing, error: fetchError } = await supabase
        .from("news_posts")
        .select("author_id")
        .eq("id", id)
        .single();

    if (fetchError || !existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.author_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
        .from("news_posts")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
