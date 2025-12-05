"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Message, MessageAttachment, MessageLink, ReactionGroup } from "@/lib/types/chat";

const MESSAGES_PER_PAGE = 50;

export function useRoomMessages(roomId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Helper to group reactions
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

    // Fetch messages with all related data
    const fetchMessages = useCallback(async (before?: string) => {
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
                .from("messages")
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        display_name,
                        avatar_url
                    ),
                    attachments:message_attachments (*),
                    links:message_links (*),
                    reactions:message_reactions (*),
                    thread:threads!root_message_id (*)
                `)
                .eq("room_id", roomId)
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
                .limit(MESSAGES_PER_PAGE);

            if (before) {
                query = query.lt("created_at", before);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            if (data) {
                // Transform and add public URLs for attachments
                const transformedMessages = data.map((msg: any) => ({
                    ...msg,
                    profiles: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles,
                    attachments: msg.attachments?.map((att: MessageAttachment) => ({
                        ...att,
                        public_url: supabase.storage
                            .from("chat-images")
                            .getPublicUrl(att.storage_path).data.publicUrl,
                    })),
                    reactions: groupReactions(msg.reactions || [], currentUserId),
                    thread: Array.isArray(msg.thread) ? msg.thread[0] : msg.thread,
                })).reverse(); // Reverse to show oldest first

                if (before) {
                    setMessages(prev => [...transformedMessages, ...prev]);
                } else {
                    setMessages(transformedMessages);
                }

                setHasMore(data.length === MESSAGES_PER_PAGE);
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch messages");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [supabase, roomId]);

    // Load more (older) messages
    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && messages.length > 0) {
            fetchMessages(messages[0].created_at);
        }
    }, [loadingMore, hasMore, messages, fetchMessages]);

    // Send a new message
    const sendMessage = useCallback(async (
        content: string,
        attachments: { path: string; width?: number; height?: number; mimeType?: string }[] = []
    ) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Detect URLs in content
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = content.match(urlRegex) || [];
        const hasLinks = urls.length > 0;
        const hasAttachments = attachments.length > 0;

        // Insert message
        const { data: message, error: msgError } = await supabase
            .from("messages")
            .insert({
                room_id: roomId,
                user_id: user.id,
                content,
                kind: "normal",
                has_attachments: hasAttachments,
                has_links: hasLinks,
            })
            .select()
            .single();

        if (msgError) throw msgError;

        // Insert attachments
        if (hasAttachments && message) {
            const attachmentRows = attachments.map(att => ({
                message_id: message.id,
                storage_path: att.path,
                width: att.width,
                height: att.height,
                mime_type: att.mimeType,
            }));
            await supabase.from("message_attachments").insert(attachmentRows);
        }

        // Insert link placeholders and fetch previews
        if (hasLinks && message) {
            for (const url of urls) {
                await supabase.from("message_links").insert({
                    message_id: message.id,
                    url,
                });
                // Fetch preview asynchronously
                fetch("/api/link-preview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url, messageId: message.id }),
                }).catch(console.error);
            }
        }

        return message;
    }, [supabase, roomId]);

    // Edit a message
    const editMessage = useCallback(async (messageId: string, newContent: string) => {
        const { error } = await supabase
            .from("messages")
            .update({
                content: newContent,
                edited_at: new Date().toISOString()
            })
            .eq("id", messageId);

        if (error) throw error;
    }, [supabase]);

    // Delete a message (soft delete)
    const deleteMessage = useCallback(async (messageId: string) => {
        const { error } = await supabase
            .from("messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", messageId);

        if (error) throw error;
    }, [supabase]);

    // Send system message
    const sendSystemMessage = useCallback(async (content: string) => {
        const { error } = await supabase
            .from("messages")
            .insert({
                room_id: roomId,
                kind: "system",
                content,
            });

        if (error) throw error;
    }, [supabase, roomId]);

    // Setup realtime subscription
    useEffect(() => {
        fetchMessages();

        // Subscribe to changes
        channelRef.current = supabase
            .channel(`room-messages:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
                },
                async (payload) => {
                    // Fetch the full message with relations
                    const { data } = await supabase
                        .from("messages")
                        .select(`
                            *,
                            profiles:user_id (id, display_name, avatar_url),
                            attachments:message_attachments (*),
                            links:message_links (*),
                            reactions:message_reactions (*)
                        `)
                        .eq("id", payload.new.id)
                        .single();

                    if (data) {
                        const { data: { user } } = await supabase.auth.getUser();
                        const transformedMsg = {
                            ...data,
                            profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
                            attachments: data.attachments?.map((att: MessageAttachment) => ({
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
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
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
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    setMessages(prev =>
                        prev.filter(msg => msg.id !== payload.old.id)
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "message_reactions",
                },
                async (payload) => {
                    // Get the message_id from the payload
                    const newData = payload.new as { message_id?: string } | null;
                    const oldData = payload.old as { message_id?: string } | null;
                    const messageId = newData?.message_id || oldData?.message_id;
                    if (!messageId) return;

                    // Fetch updated reactions for this message
                    const { data: reactions } = await supabase
                        .from("message_reactions")
                        .select("*")
                        .eq("message_id", messageId);

                    if (reactions) {
                        const { data: { user } } = await supabase.auth.getUser();
                        const grouped = groupReactions(reactions, user?.id || "");

                        setMessages(prev => {
                            // Check if this message exists in our list
                            const msgExists = prev.some(m => m.id === messageId);
                            if (!msgExists) return prev;

                            return prev.map(msg =>
                                msg.id === messageId
                                    ? { ...msg, reactions: grouped }
                                    : msg
                            );
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [roomId, supabase, fetchMessages]);

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
        sendSystemMessage,
        refetch: fetchMessages,
    };
}
