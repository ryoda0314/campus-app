"use client";

import { useState, useCallback } from "react";
import { Message, ThreadMessage } from "@/lib/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Send, Loader2, Clock } from "lucide-react";
import { useThreadMessages, useThreadForMessage, useReactions } from "@/hooks/chat";
import { ReactionsBar } from "./ReactionsBar";
import { TranslateButton } from "./TranslateButton";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface ThreadPanelProps {
    rootMessage: Message;
    currentUserId: string;
    onClose: () => void;
}

export function ThreadPanel({ rootMessage, currentUserId, onClose }: ThreadPanelProps) {
    const { thread, loading: threadLoading } = useThreadForMessage(rootMessage.id);
    const { messages, loading, sendMessage, editMessage, deleteMessage, refetch } = useThreadMessages(thread?.id || null);
    const { toggleReaction } = useReactions();
    const [replyContent, setReplyContent] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = useCallback(async () => {
        if (!replyContent.trim() || !thread) return;

        setSending(true);
        try {
            await sendMessage(replyContent.trim());
            setReplyContent("");
        } catch (error) {
            console.error("Failed to send reply:", error);
        } finally {
            setSending(false);
        }
    }, [replyContent, thread, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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

    const renderThreadMessage = (msg: ThreadMessage) => {
        const timeAgo = formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ja });
        const isOwn = msg.user_id === currentUserId;
        const isDeleted = !!msg.deleted_at;

        if (isDeleted) {
            return (
                <div key={msg.id} className="py-2 text-sm text-muted-foreground italic">
                    このメッセージは削除されました
                </div>
            );
        }

        return (
            <div key={msg.id} className="flex gap-2 py-2 group">
                <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                        {msg.profiles?.display_name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-xs">
                            {msg.profiles?.display_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo}
                        </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                    </p>
                    <ReactionsBar
                        reactions={msg.reactions || []}
                        onToggle={(emoji) => handleToggleReaction(emoji, msg.id)}
                    />
                    {msg.content && (
                        <TranslateButton text={msg.content} messageId={msg.id} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-card border-l">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">スレッド</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Root message */}
            <div className="p-4 border-b bg-muted/30">
                <div className="flex gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={rootMessage.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                            {rootMessage.profiles?.display_name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm">
                                {rootMessage.profiles?.display_name || "Anonymous"}
                            </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">
                            {rootMessage.content}
                        </p>
                    </div>
                </div>
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading || threadLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        まだ返信はありません
                    </p>
                ) : (
                    <div className="space-y-1 divide-y divide-border/50">
                        {messages.map(renderThreadMessage)}
                    </div>
                )}
            </div>

            {/* Reply input */}
            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="返信を入力..."
                        className="min-h-[40px] max-h-[100px] resize-none"
                        rows={1}
                        disabled={sending || !thread}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!replyContent.trim() || sending || !thread}
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
