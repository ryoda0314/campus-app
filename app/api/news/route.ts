import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    NewsPostWithAuthor,
    DigestItemWithSummary,
    CreateNewsPostRequest,
    NewsListResponse,
    NewsCursor,
    DigestLang
} from "@/lib/types/news";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Helper: Decode cursor
function decodeCursor(cursor: string): NewsCursor | null {
    try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        return JSON.parse(decoded) as NewsCursor;
    } catch {
        return null;
    }
}

// Helper: Encode cursor
function encodeCursor(created_at: string, id: string): string {
    return Buffer.from(JSON.stringify({ created_at, id })).toString('base64');
}

// GET /api/news - List news posts
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const tab = searchParams.get("tab") || "campus";
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT)), MAX_LIMIT);
    const cursor = searchParams.get("cursor");
    const lang = (searchParams.get("lang") || "jp") as DigestLang;

    if (tab === "campus") {
        // Campus News
        let query = supabase
            .from("news_posts")
            .select(`
                *,
                author:profiles!author_id(id, display_name, avatar_url)
            `)
            .eq("visibility", "public")
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(limit + 1);

        if (category) {
            query = query.eq("category", category);
        }

        if (cursor) {
            const cur = decodeCursor(cursor);
            if (cur) {
                query = query.or(`created_at.lt.${cur.created_at},and(created_at.eq.${cur.created_at},id.lt.${cur.id})`);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error("[GET /api/news] campus error:", error);
            // Check if table doesn't exist
            if (error.message.includes("does not exist")) {
                return NextResponse.json({
                    error: "Table news_posts not found. Please run DB migration.",
                    items: []
                }, { status: 200 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const hasMore = data && data.length > limit;
        const items = hasMore ? data.slice(0, limit) : (data || []);
        const nextCursor = hasMore && items.length > 0
            ? encodeCursor(items[items.length - 1].created_at, items[items.length - 1].id)
            : undefined;

        const response: NewsListResponse = {
            items: items as NewsPostWithAuthor[],
            nextCursor,
        };

        return NextResponse.json(response);

    } else if (tab === "digest") {
        // External Digest
        const sort = searchParams.get("sort") || "date"; // "date" or "importance"
        const days = parseInt(searchParams.get("days") || "7"); // Filter by recent N days

        // Calculate date filter
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        const dateFromStr = dateFrom.toISOString();

        let query = supabase
            .from("digest_items")
            .select(`
                *,
                summary:digest_summaries(*)
            `)
            .gte("published_at", dateFromStr)
            .gte("importance", 20);

        // Apply sorting
        if (sort === "importance") {
            query = query.order("importance", { ascending: false });
        } else {
            query = query.order("published_at", { ascending: false });
        }
        query = query.order("id", { ascending: false });
        query = query.limit(limit + 1);

        if (cursor) {
            const cur = decodeCursor(cursor);
            if (cur) {
                if (sort === "importance") {
                    // For importance sort, we need different cursor logic
                    query = query.or(`importance.lt.${cur.created_at},and(importance.eq.${cur.created_at},id.lt.${cur.id})`);
                } else {
                    query = query.or(`published_at.lt.${cur.created_at},and(published_at.eq.${cur.created_at},id.lt.${cur.id})`);
                }
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error("[GET /api/news] digest error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Process items to flatten summary array to single object
        const processedItems = (data || []).map((item: { summary?: Array<{ lang: string }> }) => {
            const summaryArray = item.summary || [];
            // Find summary for the requested lang, or fall back to first available
            const summary = summaryArray.find((s) => s.lang === lang) || summaryArray[0] || null;
            return {
                ...item,
                summary,
            };
        });

        // Get today's memo
        const today = new Date().toISOString().split('T')[0];
        const { data: memoData } = await supabase
            .from("digest_daily_memos")
            .select("*")
            .eq("date", today)
            .eq("lang", lang)
            .single();

        const hasMore = processedItems.length > limit;
        const items = hasMore ? processedItems.slice(0, limit) : processedItems;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lastItem = items[items.length - 1] as any;
        const nextCursor = hasMore && items.length > 0
            ? encodeCursor(lastItem.published_at, lastItem.id)
            : undefined;

        const response: NewsListResponse = {
            items: items as DigestItemWithSummary[],
            memo: memoData || undefined,
            nextCursor,
        };

        return NextResponse.json(response);
    }

    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
}

// POST /api/news - Create campus news
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateNewsPostRequest = await req.json();

    // Validate required fields
    if (!body.title || body.title.trim().length === 0) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (body.title.length > 120) {
        return NextResponse.json({ error: "Title too long (max 120)" }, { status: 400 });
    }

    // Validate visibility + room_id
    if (body.visibility === "room" && !body.room_id) {
        return NextResponse.json({ error: "room_id required for room visibility" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("news_posts")
        .insert({
            author_id: user.id,
            title: body.title.trim(),
            body: body.body || null,
            category: body.category || "notice",
            visibility: body.visibility || "public",
            room_id: body.room_id || null,
            pinned_until: body.pinned_until || null,
            expires_at: body.expires_at || null,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
