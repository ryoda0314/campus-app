"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send, X, Loader2 } from "lucide-react";
import { useImageUpload } from "@/hooks/chat";
import Image from "next/image";

interface PendingImage {
    file: File;
    preview: string;
}

interface MessageInputProps {
    roomId: string;
    onSend: (content: string, attachments?: { path: string; width?: number; height?: number; mimeType: string }[]) => Promise<void>;
    placeholder?: string;
    disabled?: boolean;
}

export function MessageInput({ roomId, onSend, placeholder = "Type a message...", disabled }: MessageInputProps) {
    const [content, setContent] = useState("");
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { uploadImages, uploading } = useImageUpload(roomId);

    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newImages = files.slice(0, 5 - pendingImages.length).map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setPendingImages(prev => [...prev, ...newImages]);
        e.target.value = "";
    }, [pendingImages.length]);

    const removeImage = useCallback((index: number) => {
        setPendingImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    const handleSend = useCallback(async () => {
        const trimmedContent = content.trim();
        if (!trimmedContent && pendingImages.length === 0) return;

        setSending(true);
        try {
            let attachments: { path: string; width?: number; height?: number; mimeType: string }[] = [];

            // Upload images if any
            if (pendingImages.length > 0) {
                const files = pendingImages.map(p => p.file);
                attachments = await uploadImages(files);
            }

            await onSend(trimmedContent, attachments.length > 0 ? attachments : undefined);

            // Clean up
            setContent("");
            pendingImages.forEach(p => URL.revokeObjectURL(p.preview));
            setPendingImages([]);
        } catch (error) {
            console.error("Send failed:", error);
        } finally {
            setSending(false);
        }
    }, [content, pendingImages, uploadImages, onSend]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const isDisabled = disabled || sending || uploading;

        <div className="border-t bg-background px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {/* Pending images preview */}
            {pendingImages.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 pt-4 px-2">
                    {pendingImages.map((img, i) => (
                        <div key={i} className="relative flex-shrink-0">
                            <Image
                                src={img.preview}
                                alt={`Pending ${i + 1}`}
                                width={80}
                                height={80}
                                className="w-20 h-20 object-cover rounded-lg border"
                            />
                            <button
                                onClick={() => removeImage(i)}
                                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input area */}
            <div className="flex gap-3 items-end">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={isDisabled || pendingImages.length >= 5}
                />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDisabled || pendingImages.length >= 5}
                    className="flex-shrink-0 rounded-full h-10 w-10 hover:bg-muted"
                >
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                </Button>

                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    className="min-h-[44px] max-h-[120px] resize-none bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl px-4 py-3"
                    rows={1}
                />

                <Button
                    type="button"
                    size="icon"
                    onClick={handleSend}
                    disabled={isDisabled || (!content.trim() && pendingImages.length === 0)}
                    className="flex-shrink-0 rounded-full h-10 w-10"
                >
                    {sending || uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>
        </div>

                <Button
                    type="button"
                    size="icon"
                    onClick={handleSend}
                    disabled={isDisabled || (!content.trim() && pendingImages.length === 0)}
                    className="flex-shrink-0"
                >
                    {sending || uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div >
        </div >
    );
}
