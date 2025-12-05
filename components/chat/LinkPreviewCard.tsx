"use client";

import { MessageLink } from "@/lib/types/chat";
import { ExternalLink, Loader2 } from "lucide-react";
import Image from "next/image";

interface LinkPreviewCardProps {
    link: MessageLink;
}

export function LinkPreviewCard({ link }: LinkPreviewCardProps) {
    const isLoading = !link.og_title && !link.og_description;

    if (isLoading) {
        return (
            <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="truncate">{link.url}</span>
                </div>
            </a>
        );
    }

    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden"
        >
            <div className="flex">
                {/* Image */}
                {link.og_image_url && (
                    <div className="flex-shrink-0 w-24 h-24 relative">
                        <Image
                            src={link.og_image_url}
                            alt={link.og_title || "Preview"}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 p-3 min-w-0">
                    {/* Domain */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <ExternalLink className="h-3 w-3" />
                        <span>{link.domain}</span>
                    </div>

                    {/* Title */}
                    {link.og_title && (
                        <h4 className="font-medium text-sm line-clamp-1 mb-0.5">
                            {link.og_title}
                        </h4>
                    )}

                    {/* Description */}
                    {link.og_description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {link.og_description}
                        </p>
                    )}
                </div>
            </div>
        </a>
    );
}
