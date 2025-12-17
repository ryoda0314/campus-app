"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tag, TagNamespace, CreateTagInput } from "@/lib/types/library";

export function useTags(namespace?: TagNamespace) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const fetchTags = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from("tags")
                .select("*")
                .order("name", { ascending: true });

            if (namespace) {
                query = query.eq("namespace", namespace);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            setTags(data || []);
        } catch (err) {
            console.error("Failed to fetch tags:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch tags");
        } finally {
            setLoading(false);
        }
    }, [supabase, namespace]);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    // Get tags by namespace
    const getTagsByNamespace = useCallback((ns: TagNamespace): Tag[] => {
        return tags.filter(t => t.namespace === ns);
    }, [tags]);

    // Get fixed tags only
    const fixedTags = useMemo(() => {
        return tags.filter(t => t.is_fixed);
    }, [tags]);

    // Get variable tags (entity/topic)
    const variableTags = useMemo(() => {
        return tags.filter(t => !t.is_fixed);
    }, [tags]);

    // Get tag names for AI context
    const tagNames = useMemo(() => {
        return tags.map(t => t.name);
    }, [tags]);

    // Create new tag (only entity/topic allowed)
    const createTag = async (input: CreateTagInput): Promise<Tag | null> => {
        if (!["entity", "topic"].includes(input.namespace)) {
            console.error("Only entity/topic tags can be created");
            return null;
        }

        try {
            const { data, error } = await supabase
                .from("tags")
                .insert({
                    name: input.name,
                    namespace: input.namespace,
                    is_fixed: false,
                    description: input.description,
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Refresh tags
            await fetchTags();
            return data;
        } catch (err) {
            console.error("Failed to create tag:", err);
            return null;
        }
    };

    // Find tag by name
    const findTagByName = useCallback((name: string): Tag | undefined => {
        return tags.find(t => t.name === name);
    }, [tags]);

    // Find tags by names (batch)
    const findTagsByNames = useCallback((names: string[]): Tag[] => {
        return tags.filter(t => names.includes(t.name));
    }, [tags]);

    return {
        tags,
        loading,
        error,
        fixedTags,
        variableTags,
        tagNames,
        getTagsByNamespace,
        createTag,
        findTagByName,
        findTagsByNames,
        refetch: fetchTags,
    };
}

// Browse categories mapping
export const BROWSE_CATEGORIES = {
    prompt: {
        label: "Prompt",
        namespaces: ["prompt"] as TagNamespace[],
        description: "Prompt engineering patterns",
    },
    api: {
        label: "API",
        namespaces: ["api"] as TagNamespace[],
        description: "API specifications and constraints",
    },
    model: {
        label: "Model",
        namespaces: ["model"] as TagNamespace[],
        description: "AI model information",
    },
    implementation: {
        label: "Implementation",
        namespaces: ["impl", "stack"] as TagNamespace[],
        description: "Implementation patterns",
    },
    notes: {
        label: "Notes",
        namespaces: ["status", "impact"] as TagNamespace[],
        description: "Personal notes and status",
    },
} as const;
