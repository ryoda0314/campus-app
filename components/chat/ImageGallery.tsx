"use client";

import { useState } from "react";
import { MessageAttachment } from "@/lib/types/chat";
import Image from "next/image";
import { X } from "lucide-react";

interface ImageGalleryProps {
    attachments: MessageAttachment[];
}

export function ImageGallery({ attachments }: ImageGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (attachments.length === 0) return null;

    const gridClass =
        attachments.length === 1 ? "grid-cols-1" :
            attachments.length === 2 ? "grid-cols-2" :
                attachments.length === 3 ? "grid-cols-3" :
                    "grid-cols-2";

    return (
        <>
            {/* Grid */}
            <div className={`grid gap-2 mt-2 ${gridClass}`}>
                {attachments.map((att, i) => (
                    <button
                        key={att.id}
                        onClick={() => setLightboxIndex(i)}
                        className="relative aspect-square rounded-lg overflow-hidden border bg-muted hover:opacity-90 transition-opacity"
                    >
                        <Image
                            src={att.public_url || ""}
                            alt={`Attachment ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 200px"
                        />
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="relative max-w-full max-h-full">
                        <Image
                            src={attachments[lightboxIndex].public_url || ""}
                            alt="Full size"
                            width={attachments[lightboxIndex].width || 800}
                            height={attachments[lightboxIndex].height || 600}
                            className="max-h-[90vh] w-auto object-contain"
                        />
                    </div>

                    {/* Navigation dots */}
                    {attachments.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {attachments.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex(i);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-colors ${i === lightboxIndex ? "bg-white" : "bg-white/50"
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
