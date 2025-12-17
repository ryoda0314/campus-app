import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/news/[id]/save-to-library - Save news to library
export async function POST(
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

    // Get the news post
    const { data: post, error: postError } = await supabase
        .from("news_posts")
        .select("*")
        .eq("id", id)
        .single();

    if (postError || !post) {
        return NextResponse.json({ error: "News post not found" }, { status: 404 });
    }

    // Only author can save to library (prevents random linking)
    if (post.author_id !== user.id) {
        return NextResponse.json({ error: "Only author can save to library" }, { status: 403 });
    }

    // Check if already saved
    if (post.library_item_id) {
        return NextResponse.json({
            error: "Already saved to library",
            library_item_id: post.library_item_id
        }, { status: 400 });
    }

    // Prepare raw text for transformation
    const rawText = `${post.title}\n\n${post.body || ""}`;

    // Call transform API internally
    const transformResponse = await fetch(new URL("/api/library/transform", req.url), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": req.headers.get("Cookie") || "",
        },
        body: JSON.stringify({
            raw_text: rawText,
            existing_tags: [],
        }),
    });

    if (!transformResponse.ok) {
        const error = await transformResponse.json();
        return NextResponse.json({
            error: "Transform failed",
            details: error
        }, { status: 500 });
    }

    const transformResult = await transformResponse.json();

    // Create library item
    const { data: source, error: sourceError } = await supabase
        .from("sources")
        .insert({
            user_id: user.id,
            input_type: "paste",
            raw_text: rawText,
        })
        .select()
        .single();

    if (sourceError) {
        return NextResponse.json({ error: sourceError.message }, { status: 500 });
    }

    const { data: libraryItem, error: libraryError } = await supabase
        .from("library_items")
        .insert({
            user_id: user.id,
            source_id: source.id,
            title: transformResult.title,
            tldr: transformResult.tldr,
            sections: transformResult.sections,
            model_name: transformResult.model_name,
        })
        .select()
        .single();

    if (libraryError) {
        return NextResponse.json({ error: libraryError.message }, { status: 500 });
    }

    // Handle tags
    if (transformResult.tags && transformResult.tags.length > 0) {
        for (const tag of transformResult.tags) {
            // Check if tag exists
            let { data: existingTag } = await supabase
                .from("tags")
                .select("id")
                .eq("namespace", tag.namespace)
                .eq("name", tag.name)
                .single();

            if (!existingTag) {
                // Create new tag
                const { data: newTag } = await supabase
                    .from("tags")
                    .insert({
                        namespace: tag.namespace,
                        name: tag.name,
                        created_by: user.id,
                    })
                    .select()
                    .single();
                existingTag = newTag;
            }

            if (existingTag) {
                // Link tag to library item
                await supabase
                    .from("library_item_tags")
                    .insert({
                        library_item_id: libraryItem.id,
                        tag_id: existingTag.id,
                        origin: tag.origin || "ai_existing",
                    });
            }
        }
    }

    // Update news post with library_item_id
    const { error: updateError } = await supabase
        .from("news_posts")
        .update({ library_item_id: libraryItem.id })
        .eq("id", id);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        library_item_id: libraryItem.id,
    });
}
