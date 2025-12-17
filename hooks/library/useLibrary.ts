"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Source,
    LibraryItem,
    LibraryItemWithSource,
    CreateSourceInput,
    CreateLibraryItemInput,
    UpdateLibraryItemInput,
    TagWithOrigin,
    BrowseFilter,
    TransformRequest,
    TransformResponse,
} from "@/lib/types/library";

export function useLibrary(userId?: string) {
    const [items, setItems] = useState<LibraryItemWithSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<BrowseFilter>({});
    const supabase = useMemo(() => createClient(), []);

    // Fetch library items with optional filtering
    const fetchItems = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from("library_items")
                .select(`
                    *,
                    source:sources(*),
                    library_item_tags(
                        origin,
                        confidence,
                        tag:tags(*)
                    )
                `)
                .eq("user_id", userId)
                .eq("status", "ready")
                .order("created_at", { ascending: false });

            // Apply search filter
            if (filter.search) {
                query = query.or(`title.ilike.%${filter.search}%,tldr.ilike.%${filter.search}%`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            // Transform the data to include tags
            const itemsWithTags: LibraryItemWithSource[] = (data || []).map((item) => {
                const tags: TagWithOrigin[] = (item.library_item_tags || []).map((lit: { origin: string; confidence: number | null; tag: object }) => ({
                    ...lit.tag,
                    origin: lit.origin,
                    confidence: lit.confidence,
                }));

                return {
                    ...item,
                    tags,
                    library_item_tags: undefined,
                };
            });

            // Apply tag filter (client-side for now)
            let filteredItems = itemsWithTags;
            if (filter.tags && filter.tags.length > 0) {
                filteredItems = itemsWithTags.filter(item =>
                    item.tags?.some(t => filter.tags!.includes(t.name))
                );
            }

            setItems(filteredItems);
        } catch (err) {
            console.error("Failed to fetch library items:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch items");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase, userId, filter.search, filter.tags?.join(","), filter.category]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Realtime subscription (separate from fetchItems to avoid loops)
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel("library_items_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "library_items",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Delay to avoid rapid re-fetches
                    setTimeout(() => {
                        fetchItems();
                    }, 100);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase, userId]);

    // Create source
    const createSource = async (input: CreateSourceInput): Promise<Source | null> => {
        if (!userId) return null;

        try {
            const { data, error } = await supabase
                .from("sources")
                .insert({
                    user_id: userId,
                    input_type: input.input_type,
                    url: input.url,
                    file_path: input.file_path,
                    raw_text: input.raw_text,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Failed to create source:", err);
            return null;
        }
    };

    // Create library item
    const createItem = async (input: CreateLibraryItemInput): Promise<LibraryItem | null> => {
        if (!userId) return null;

        try {
            const { data, error } = await supabase
                .from("library_items")
                .insert({
                    user_id: userId,
                    source_id: input.source_id,
                    status: "ready",
                    title: input.title,
                    tldr: input.tldr,
                    sections: input.sections || [],
                    personal_note: input.personal_note,
                })
                .select()
                .single();

            if (error) throw error;

            // Add tags
            if (input.tag_ids && input.tag_ids.length > 0) {
                const tagInserts = input.tag_ids.map(t => ({
                    library_item_id: data.id,
                    tag_id: t.tag_id,
                    origin: t.origin,
                    confidence: t.confidence,
                }));

                await supabase.from("library_item_tags").insert(tagInserts);
            }

            await fetchItems();
            return data;
        } catch (err) {
            console.error("Failed to create library item:", err);
            return null;
        }
    };

    // Update library item
    const updateItem = async (id: string, input: UpdateLibraryItemInput): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("library_items")
                .update(input)
                .eq("id", id);

            if (error) throw error;
            await fetchItems();
            return true;
        } catch (err) {
            console.error("Failed to update library item:", err);
            return false;
        }
    };

    // Delete library item
    const deleteItem = async (id: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("library_items")
                .delete()
                .eq("id", id);

            if (error) throw error;
            await fetchItems();
            return true;
        } catch (err) {
            console.error("Failed to delete library item:", err);
            return false;
        }
    };

    // Get single item
    const getItem = async (id: string): Promise<LibraryItemWithSource | null> => {
        try {
            const { data, error } = await supabase
                .from("library_items")
                .select(`
                    *,
                    source:sources(*),
                    library_item_tags(
                        origin,
                        confidence,
                        tag:tags(*)
                    )
                `)
                .eq("id", id)
                .single();

            if (error) throw error;

            const tags: TagWithOrigin[] = (data.library_item_tags || []).map((lit: { origin: string; confidence: number | null; tag: object }) => ({
                ...lit.tag,
                origin: lit.origin,
                confidence: lit.confidence,
            }));

            return {
                ...data,
                tags,
                library_item_tags: undefined,
            };
        } catch (err) {
            console.error("Failed to get library item:", err);
            return null;
        }
    };

    // Transform raw text using AI
    const transformText = async (
        rawText: string,
        existingTags: string[],
        sourceUrl?: string
    ): Promise<TransformResponse> => {
        try {
            const response = await fetch("/api/library/transform", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_text: rawText,
                    existing_tags: existingTags,
                    source_url: sourceUrl,
                } as TransformRequest),
            });

            const data: TransformResponse = await response.json();
            return data;
        } catch (err) {
            console.error("Failed to transform text:", err);
            return { success: false, error: "Network error" };
        }
    };

    return {
        items,
        loading,
        error,
        filter,
        setFilter,
        createSource,
        createItem,
        updateItem,
        deleteItem,
        getItem,
        transformText,
        refetch: fetchItems,
    };
}
