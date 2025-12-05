"use client";

import { useState, useCallback } from "react";
import { Message } from "@/lib/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MessageSquare, Pencil, Trash2, Check, X, Clock } from "lucide-react";
import { ReactionsBar } from "./ReactionsBar";
import { ImageGallery } from "./ImageGallery";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { TranslateButton } from "./TranslateButton";
import { useReactions } from "@/hooks/chat";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface MessageItemProps {
    message: Message;
    currentUserId: string;
    onOpenThread?: (message: Message) => void;
    onEdit?: (messageId: string, newContent: string) => void;
    onDelete?: (messageId: string) => void;
    onReactionChange?: () => void;
}

// Time window for editing (10 minutes in ms)
const EDIT_WINDOW_MS = 10 * 60 * 1000;

export function MessageItem({
    message,
    currentUserId,
    onOpenThread,
    onEdit,
    onDelete,
    onReactionChange,
}: MessageItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content || "");
    const { toggleReaction } = useReactions();

    const isOwn = message.user_id === currentUserId;
    const isSystem = message.kind === "system";
    const isDeleted = !!message.deleted_at;
    const createdAt = new Date(message.created_at);
    const canEdit = isOwn && !isSystem && !isDeleted &&
        (Date.now() - createdAt.getTime()) < EDIT_WINDOW_MS;
    const replyCount = message.thread?.reply_count || 0;

    // Format timestamp
    const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: ja });

    // Handle mention highlighting
    const renderContent = (text: string | null) => {
        if (!text) return null;

        // Simple mention regex: @word
        const parts = text.split(/(@\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith("@")) {
                return (
                    <span key={i} className="text-primary font-medium bg-primary/10 rounded px-0.5">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const handleToggleReaction = useCallback(async (emoji: string) => {
        try {
            await toggleReaction(emoji, message.id);
            onReactionChange?.();
        } catch (err) {
            console.error("Failed to toggle reaction:", err);
        }
    }, [toggleReaction, message.id, onReactionChange]);

    const handleSaveEdit = useCallback(async () => {
        if (editContent.trim() && onEdit) {
            await onEdit(message.id, editContent.trim());
            setIsEditing(false);
        }
    }, [editContent, onEdit, message.id]);

    const handleCancelEdit = useCallback(() => {
        setEditContent(message.content || "");
        setIsEditing(false);
    }, [message.content]);

    // System message rendering
    if (isSystem) {
        return (
            <div className="flex justify-center py-2">
                <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }

    // Deleted message rendering
    if (isDeleted) {
        return (
            <div className="flex gap-3 py-3 px-4 group">
                <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground italic">
                        このメッセージは削除されました
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 py-3 px-4 hover:bg-muted/30 group transition-colors">
            {/* Avatar */}
            <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={message.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                    {message.profiles?.display_name?.[0] || "U"}
                </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">
                        {message.profiles?.display_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo}
                    </span>
                    {message.edited_at && (
                        <span className="text-xs text-muted-foreground">(編集済み)</span>
                    )}
                </div>

                {/* Text content */}
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px]"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                                <Check className="h-4 w-4 mr-1" />
                                保存
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 mr-1" />
                                キャンセル
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {message.content && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                                {renderContent(message.content)}
                            </p>
                        )}
                    </>
                )}

                {/* Images */}
                {message.attachments && message.attachments.length > 0 && (
                    <ImageGallery attachments={message.attachments} />
                )}

                {/* Link previews */}
                {message.links?.map((link) => (
                    <LinkPreviewCard key={link.id} link={link} />
                ))}

                {/* Reactions and Thread button */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <ReactionsBar
                        reactions={message.reactions || []}
                        onToggle={handleToggleReaction}
                    />

                    {/* Thread button */}
                    <button
                        onClick={() => onOpenThread?.(message)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors border ${replyCount > 0
                            ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                            : "bg-muted/50 border-border hover:bg-muted hover:border-primary/50"
                            }`}
                    >
                        <MessageSquare className="h-3 w-3" />
                        {replyCount > 0 ? (
                            <span className="font-medium">{replyCount}件の返信</span>
                        ) : (
                            "返信"
                        )}
                    </button>
                </div>

                {/* Translation */}
                {message.content && !isEditing && (
                    <TranslateButton text={message.content} messageId={message.id} />
                )}
            </div>

            {/* Actions */}
            {!isEditing && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canEdit && (
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    編集
                                </DropdownMenuItem>
                            )}
                            {isOwn && (
                                <DropdownMenuItem
                                    onClick={() => onDelete?.(message.id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    削除
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
}
