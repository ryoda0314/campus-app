import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RelatedItem {
    id: string;
    title: string;
    tldr: string | null;
    created_at: string;
    matching_tags: string[];
    score: number;
}

interface RelatedResponse {
    success: boolean;
    items?: RelatedItem[];
    error?: string;
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json<RelatedResponse>(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get item ID from query params
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get("itemId");
        const limit = parseInt(searchParams.get("limit") || "5", 10);

        if (!itemId) {
            return NextResponse.json<RelatedResponse>(
                { success: false, error: "itemId is required" },
                { status: 400 }
            );
        }

        // Get tags for the current item
        const { data: currentItemTags, error: tagsError } = await supabase
            .from("library_item_tags")
            .select("tag_id, tags(name)")
            .eq("library_item_id", itemId);

        if (tagsError) {
            console.error("Error fetching item tags:", tagsError);
            return NextResponse.json<RelatedResponse>(
                { success: false, error: "Failed to fetch item tags" },
                { status: 500 }
            );
        }

        if (!currentItemTags || currentItemTags.length === 0) {
            return NextResponse.json<RelatedResponse>({
                success: true,
                items: [],
            });
        }

        const tagIds = currentItemTags.map(t => t.tag_id);
        const tagNames = currentItemTags.map(t => (t.tags as any)?.name).filter(Boolean);

        // Find other items with matching tags
        const { data: relatedItemTags, error: relatedError } = await supabase
            .from("library_item_tags")
            .select(`
                library_item_id,
                tag_id,
                tags(name),
                library_items!inner(id, title, tldr, created_at, user_id)
            `)
            .in("tag_id", tagIds)
            .neq("library_item_id", itemId)
            .eq("library_items.user_id", user.id);

        if (relatedError) {
            console.error("Error fetching related items:", relatedError);
            return NextResponse.json<RelatedResponse>(
                { success: false, error: "Failed to fetch related items" },
                { status: 500 }
            );
        }

        // Group by item and calculate score
        const itemScores = new Map<string, {
            item: any;
            matchingTags: Set<string>;
            score: number;
        }>();

        for (const row of relatedItemTags || []) {
            const item = row.library_items as any;
            const tagName = (row.tags as any)?.name;

            if (!item || !item.id) continue;

            if (!itemScores.has(item.id)) {
                itemScores.set(item.id, {
                    item,
                    matchingTags: new Set(),
                    score: 0,
                });
            }

            const entry = itemScores.get(item.id)!;
            if (tagName) {
                entry.matchingTags.add(tagName);
                entry.score += 1;
            }
        }

        // Sort by score and limit
        const sortedItems = Array.from(itemScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ item, matchingTags, score }) => ({
                id: item.id,
                title: item.title,
                tldr: item.tldr,
                created_at: item.created_at,
                matching_tags: Array.from(matchingTags),
                score,
            }));

        return NextResponse.json<RelatedResponse>({
            success: true,
            items: sortedItems,
        });

    } catch (error) {
        console.error("Related items error:", error);
        return NextResponse.json<RelatedResponse>(
            { success: false, error: "Failed to fetch related items" },
            { status: 500 }
        );
    }
}
