"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThreadMessage, ReactionGroup } from "@/lib/types/chat";

export function useThreadMessages(threadId: string | null) {
    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const groupReactions = (reactions: any[], currentUserId: string): ReactionGroup[] => {
        const groups: Record<string, ReactionGroup> = {};
        reactions.forEach(r => {
            if (!groups[r.emoji]) {
                groups[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasReacted: false };
            }
            groups[r.emoji].count++;
            groups[r.emoji].users.push(r.user_id);
            if (r.user_id === currentUserId) {
                groups[r.emoji].hasReacted = true;
            }
        });
        return Object.values(groups);
    };

    const fetchMessages = useCallback(async () => {
        if (!threadId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id || "";

            const { data, error: fetchError } = await supabase
                .from("thread_messages")
                .select(`
                    *,
                    profiles:user_id (id, display_name, avatar_url),
                    reactions:message_reactions (*)
                `)
                .eq("thread_id", threadId)
                .is("deleted_at", null)
                .order("created_at", { ascending: true });

            if (fetchError) throw fetchError;

            if (data) {
                const transformed = data.map((msg: any) => ({
                    ...msg,
                    profiles: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles,
                    reactions: groupReactions(msg.reactions || [], currentUserId),
                }));
                setMessages(transformed);
            }
        } catch (err) {
            console.error("Failed to fetch thread messages:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch thread messages");
        } finally {
            setLoading(false);
        }
    }, [supabase, threadId]);

    const sendMessage = useCallback(async (content: string) => {
        if (!threadId) throw new Error("No thread selected");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from("thread_messages")
            .insert({
                thread_id: threadId,
                user_id: user.id,
                content,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }, [supabase, threadId]);

    const editMessage = useCallback(async (messageId: string, newContent: string) => {
        const { error } = await supabase
            .from("thread_messages")
            .update({
                content: newContent,
                edited_at: new Date().toISOString()
            })
            .eq("id", messageId);

        if (error) throw error;
    }, [supabase]);

    const deleteMessage = useCallback(async (messageId: string) => {
        const { error } = await supabase
            .from("thread_messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", messageId);

        if (error) throw error;
    }, [supabase]);

    useEffect(() => {
        if (!threadId) return;

        fetchMessages();

        channelRef.current = supabase
            .channel(`thread-messages:${threadId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "thread_messages",
                    filter: `thread_id=eq.${threadId}`,
                },
                async (payload) => {
                    const { data } = await supabase
                        .from("thread_messages")
                        .select(`
                            *,
                            profiles:user_id (id, display_name, avatar_url),
                            reactions:message_reactions (*)
                        `)
                        .eq("id", payload.new.id)
                        .single();

                    if (data) {
                        const { data: { user } } = await supabase.auth.getUser();
                        const transformed = {
                            ...data,
                            profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
                            reactions: groupReactions(data.reactions || [], user?.id || ""),
                        };
                        setMessages(prev => [...prev, transformed]);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "thread_messages",
                    filter: `thread_id=eq.${threadId}`,
                },
                (payload) => {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === payload.new.id
                                ? { ...msg, ...payload.new }
                                : msg
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [threadId, supabase, fetchMessages]);

    return {
        messages,
        loading,
        error,
        sendMessage,
        editMessage,
        deleteMessage,
        refetch: fetchMessages,
    };
}

// Hook to get or create thread for a message
export function useThreadForMessage(rootMessageId: string | null) {
    const [thread, setThread] = useState<{ id: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    const getOrCreateThread = useCallback(async () => {
        if (!rootMessageId) return null;

        setLoading(true);
        try {
            // Check if thread exists
            const { data: existing } = await supabase
                .from("threads")
                .select("id")
                .eq("root_message_id", rootMessageId)
                .single();

            if (existing) {
                setThread(existing);
                return existing;
            }

            // Create new thread
            const { data: newThread, error } = await supabase
                .from("threads")
                .insert({ root_message_id: rootMessageId })
                .select("id")
                .single();

            if (error) throw error;
            setThread(newThread);
            return newThread;
        } catch (err) {
            console.error("Failed to get/create thread:", err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase, rootMessageId]);

    useEffect(() => {
        if (rootMessageId) {
            getOrCreateThread();
        } else {
            setThread(null);
        }
    }, [rootMessageId, getOrCreateThread]);

    return { thread, loading, getOrCreateThread };
}
