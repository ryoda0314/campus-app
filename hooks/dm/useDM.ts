"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DMConversation, DMMessage, DMMessageAttachment, ReactionGroup } from "@/lib/types/chat";

const MESSAGES_PER_PAGE = 50;

// Hook for DM conversations list
export function useDMConversations() {
    const [conversations, setConversations] = useState<DMConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const fetchConversations = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error: fetchError } = await supabase
                .from("dm_conversations")
                .select(`
                    *,
                    participant1:participant1_id (id, display_name, avatar_url),
                    participant2:participant2_id (id, display_name, avatar_url)
                `)
                .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
                .order("last_message_at", { ascending: false, nullsFirst: false });

            if (fetchError) throw fetchError;

            if (data) {
                // Transform to get other user info
                const transformed = data.map((conv: any) => {
                    const otherUser = conv.participant1_id === user.id
                        ? conv.participant2
                        : conv.participant1;
                    return {
                        ...conv,
                        other_user: otherUser,
                    };
                });
                setConversations(transformed);
            }
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch conversations");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Get or create conversation with a user
    const getOrCreateConversation = useCallback(async (otherUserId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Sort IDs to match the check constraint
        const [p1, p2] = [user.id, otherUserId].sort();

        // Check if exists
        const { data: existing } = await supabase
            .from("dm_conversations")
            .select("id")
            .eq("participant1_id", p1)
            .eq("participant2_id", p2)
            .single();

        if (existing) return existing.id;

        // Create new
        const { data: newConv, error } = await supabase
            .from("dm_conversations")
            .insert({
                participant1_id: p1,
                participant2_id: p2,
            })
            .select("id")
            .single();

        if (error) throw error;
        return newConv.id;
    }, [supabase]);

    useEffect(() => {
        fetchConversations();

        // Subscribe to new conversations
        const channel = supabase
            .channel("dm-conversations")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "dm_conversations",
                },
                () => {
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchConversations]);

    return {
        conversations,
        loading,
        error,
        getOrCreateConversation,
        refetch: fetchConversations,
    };
}

// Hook for DM messages in a conversation
export function useDMMessages(conversationId: string | null) {
    const [messages, setMessages] = useState<DMMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
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

    const fetchMessages = useCallback(async (before?: string) => {
        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        if (before) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id || "";

            let query = supabase
                .from("dm_messages")
                .select(`
                    *,
                    profiles:sender_id (id, display_name, avatar_url),
                    attachments:dm_message_attachments (*),
                    links:dm_message_links (*),
                    reactions:dm_message_reactions (*)
                `)
                .eq("conversation_id", conversationId)
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
                .limit(MESSAGES_PER_PAGE);

            if (before) {
                query = query.lt("created_at", before);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            if (data) {
                const transformedMessages = data.map((msg: any) => ({
                    ...msg,
                    profiles: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles,
                    attachments: msg.attachments?.map((att: DMMessageAttachment) => ({
                        ...att,
                        public_url: supabase.storage
                            .from("chat-images")
                            .getPublicUrl(att.storage_path).data.publicUrl,
                    })),
                    reactions: groupReactions(msg.reactions || [], currentUserId),
                })).reverse();

                if (before) {
                    setMessages(prev => [...transformedMessages, ...prev]);
                } else {
                    setMessages(transformedMessages);
                }

                setHasMore(data.length === MESSAGES_PER_PAGE);
            }
        } catch (err) {
            console.error("Failed to fetch DM messages:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch messages");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [supabase, conversationId]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && messages.length > 0) {
            fetchMessages(messages[0].created_at);
        }
    }, [loadingMore, hasMore, messages, fetchMessages]);

    const sendMessage = useCallback(async (
        content: string,
        attachments: { path: string; width?: number; height?: number; mimeType?: string }[] = []
    ) => {
        if (!conversationId) throw new Error("No conversation selected");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = content.match(urlRegex) || [];
        const hasLinks = urls.length > 0;
        const hasAttachments = attachments.length > 0;

        const { data: message, error: msgError } = await supabase
            .from("dm_messages")
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content,
                has_attachments: hasAttachments,
                has_links: hasLinks,
            })
            .select()
            .single();

        if (msgError) throw msgError;

        if (hasAttachments && message) {
            const attachmentRows = attachments.map(att => ({
                message_id: message.id,
                storage_path: att.path,
                width: att.width,
                height: att.height,
                mime_type: att.mimeType,
            }));
            await supabase.from("dm_message_attachments").insert(attachmentRows);
        }

        if (hasLinks && message) {
            for (const url of urls) {
                await supabase.from("dm_message_links").insert({
                    message_id: message.id,
                    url,
                });
                fetch("/api/dm-link-preview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url, messageId: message.id }),
                }).catch(console.error);
            }
        }

        return message;
    }, [supabase, conversationId]);

    const editMessage = useCallback(async (messageId: string, newContent: string) => {
        const { error } = await supabase
            .from("dm_messages")
            .update({
                content: newContent,
                edited_at: new Date().toISOString()
            })
            .eq("id", messageId);

        if (error) throw error;
    }, [supabase]);

    const deleteMessage = useCallback(async (messageId: string) => {
        const { error } = await supabase
            .from("dm_messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", messageId);

        if (error) throw error;
    }, [supabase]);

    useEffect(() => {
        if (!conversationId) return;

        fetchMessages();

        channelRef.current = supabase
            .channel(`dm-messages:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "dm_messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    const { data } = await supabase
                        .from("dm_messages")
                        .select(`
                            *,
                            profiles:sender_id (id, display_name, avatar_url),
                            attachments:dm_message_attachments (*),
                            links:dm_message_links (*),
                            reactions:dm_message_reactions (*)
                        `)
                        .eq("id", payload.new.id)
                        .single();

                    if (data) {
                        const { data: { user } } = await supabase.auth.getUser();
                        const transformedMsg = {
                            ...data,
                            profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
                            attachments: data.attachments?.map((att: DMMessageAttachment) => ({
                                ...att,
                                public_url: supabase.storage
                                    .from("chat-images")
                                    .getPublicUrl(att.storage_path).data.publicUrl,
                            })),
                            reactions: groupReactions(data.reactions || [], user?.id || ""),
                        };
                        setMessages(prev => [...prev, transformedMsg]);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "dm_messages",
                    filter: `conversation_id=eq.${conversationId}`,
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
    }, [conversationId, supabase, fetchMessages]);

    return {
        messages,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMore,
        sendMessage,
        editMessage,
        deleteMessage,
        refetch: fetchMessages,
    };
}

// Hook for DM reactions
export function useDMReactions() {
    const supabase = useMemo(() => createClient(), []);

    const toggleReaction = useCallback(async (emoji: string, messageId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Check if exists
        const { data: existing } = await supabase
            .from("dm_message_reactions")
            .select("id")
            .eq("message_id", messageId)
            .eq("user_id", user.id)
            .eq("emoji", emoji)
            .single();

        if (existing) {
            await supabase
                .from("dm_message_reactions")
                .delete()
                .eq("id", existing.id);
            return false;
        } else {
            await supabase
                .from("dm_message_reactions")
                .insert({
                    message_id: messageId,
                    user_id: user.id,
                    emoji,
                });
            return true;
        }
    }, [supabase]);

    return { toggleReaction };
}
