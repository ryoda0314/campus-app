"use client";

import { useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatSearchFilters, ChatSearchResult } from "@/lib/types/chat";

export function useChatSearch(roomId: string) {
    const [results, setResults] = useState<ChatSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const search = useCallback(async (filters: ChatSearchFilters) => {
        setLoading(true);
        setError(null);
        setResults([]);

        try {
            let query = supabase
                .from("messages")
                .select(`
                    id,
                    content,
                    created_at,
                    user_id,
                    profiles:user_id (display_name, avatar_url)
                `)
                .eq("room_id", roomId)
                .is("deleted_at", null);

            // Text search
            if (filters.query) {
                query = query.textSearch("search_vector", filters.query, {
                    type: "websearch",
                    config: "simple",
                });
            }

            // Sender filter
            if (filters.senderId) {
                query = query.eq("user_id", filters.senderId);
            }

            // Date range
            if (filters.dateFrom) {
                query = query.gte("created_at", filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte("created_at", filters.dateTo);
            }

            // Type filters
            if (filters.hasImages) {
                query = query.eq("has_attachments", true);
            }
            if (filters.hasLinks) {
                query = query.eq("has_links", true);
            }

            query = query.order("created_at", { ascending: false }).limit(50);

            const { data, error: searchError } = await query;

            if (searchError) throw searchError;

            if (data) {
                const transformed: ChatSearchResult[] = data.map((msg: any) => ({
                    id: msg.id,
                    content: msg.content,
                    created_at: msg.created_at,
                    user_id: msg.user_id,
                    profiles: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles,
                    is_thread_message: false,
                }));
                setResults(transformed);
            }
        } catch (err) {
            console.error("Search error:", err);
            setError(err instanceof Error ? err.message : "Search failed");
        } finally {
            setLoading(false);
        }
    }, [supabase, roomId]);

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return {
        results,
        loading,
        error,
        search,
        clearResults,
    };
}
