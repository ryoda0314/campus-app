"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef, useMemo } from "react";

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        display_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface RoomChatProps {
    roomId: string;
    currentUserId: string;
}

export function RoomChat({ roomId, currentUserId }: RoomChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = useMemo(() => createClient(), []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from("room_messages")
            .select(`
                id,
                content,
                created_at,
                user_id,
                profiles (
                    display_name,
                    avatar_url
                )
            `)
            .eq("room_id", roomId)
            .order("created_at", { ascending: true });

        if (!error && data) {
            // Transform data to match Message interface
            const transformedMessages = data.map((msg: any) => ({
                ...msg,
                profiles: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles,
            }));
            setMessages(transformedMessages);
        }
    };

    useEffect(() => {
        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "room_messages",
                    filter: `room_id=eq.${roomId}`,
                },
                () => {
                    fetchMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        const { error } = await supabase.from("room_messages").insert({
            room_id: roomId,
            user_id: currentUserId,
            content: newMessage,
        });

        if (!error) {
            setNewMessage("");
            await fetchMessages();
        }
        setSending(false);
    };

    return (
        <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        No messages yet. Be the first to say something!
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                        <Avatar>
                            <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                                {msg.profiles?.display_name?.[0] || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                    {msg.profiles?.display_name || "Anonymous"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(msg.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        className="flex-1"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                    />
                    <Button size="icon" type="submit" disabled={sending}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </>
    );
}
