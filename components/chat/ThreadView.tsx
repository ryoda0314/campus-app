"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Message, ThreadMessage } from "@/lib/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, Clock } from "lucide-react";
import { useThreadMessages, useThreadForMessage, useReactions } from "@/hooks/chat";
import { ReactionsBar } from "./ReactionsBar";
import { TranslateButton } from "./TranslateButton";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface ThreadViewProps {
    rootMessage: Message;
    currentUserId: string;
    onBack: () => void;
}

export function ThreadView({ rootMessage, currentUserId, onBack }: ThreadViewProps) {
    const { thread } = useThreadForMessage(rootMessage.id);
    const { messages, loading, sendMessage, refetch } = useThreadMessages(thread?.id || null);
    const { toggleReaction } = useReactions();
    const [replyContent, setReplyContent] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const handleSendReply = useCallback(async () => {
        if (!replyContent.trim() || !thread) return;

        setSending(true);
        try {
            await sendMessage(replyContent.trim());
            setReplyContent("");
            refetch();
        } catch (err) {
            console.error("Failed to send reply:", err);
        } finally {
            setSending(false);
        }
    }, [replyContent, thread, sendMessage, refetch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendReply();
        }
    };

    const handleToggleReaction = useCallback(async (emoji: string, threadMessageId: string) => {
        try {
            await toggleReaction(emoji, undefined, threadMessageId);
            refetch();
        } catch (err) {
            console.error("Failed to toggle reaction:", err);
        }
    }, [toggleReaction, refetch]);

    const rootTimeAgo = formatDistanceToNow(new Date(rootMessage.created_at), { addSuffix: true, locale: ja });

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header with back button */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h3 className="font-semibold">スレッド</h3>
                    <p className="text-xs text-muted-foreground">
                        {messages.length} 件の返信
                    </p>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                {/* Root message */}
                <div className="p-4 border-b bg-muted/20">
                    <div className="flex gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={rootMessage.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                                {rootMessage.profiles?.display_name?.[0] || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                    {rootMessage.profiles?.display_name || "Anonymous"}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {rootTimeAgo}
                                </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">
                                {rootMessage.content}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thread replies */}
                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            まだ返信がありません。最初の返信を送信しましょう！
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((reply) => (
                                <ThreadReplyItem
                                    key={reply.id}
                                    reply={reply}
                                    currentUserId={currentUserId}
                                    onToggleReaction={(emoji) => handleToggleReaction(emoji, reply.id)}
                                />
                            ))}
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Reply input */}
            <div className="p-4 border-t bg-card">
                <div className="flex gap-2">
                    <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="返信を入力... (Enterで送信)"
                        className="min-h-[44px] max-h-[120px] resize-none"
                        rows={1}
                        disabled={sending || !thread}
                    />
                    <Button
                        size="icon"
                        className="h-11 w-11 flex-shrink-0"
                        onClick={handleSendReply}
                        disabled={!replyContent.trim() || sending || !thread}
                    >
                        {sending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Thread reply item component
function ThreadReplyItem({
    reply,
    currentUserId,
    onToggleReaction
}: {
    reply: ThreadMessage;
    currentUserId: string;
    onToggleReaction: (emoji: string) => void;
}) {
    const timeAgo = formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ja });

    if (reply.deleted_at) {
        return (
            <div className="flex gap-3 py-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground italic">
                    このメッセージは削除されました
                </p>
            </div>
        );
    }

    return (
        <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-sm">
                    {reply.profiles?.display_name?.[0] || "U"}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">
                        {reply.profiles?.display_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo}
                    </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                    {reply.content}
                </p>
                <ReactionsBar
                    reactions={reply.reactions || []}
                    onToggle={onToggleReaction}
                />
                {reply.content && (
                    <TranslateButton text={reply.content} messageId={reply.id} />
                )}
            </div>
        </div>
    );
}
