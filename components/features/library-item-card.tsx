"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LibraryItemWithSource, TagWithOrigin } from "@/lib/types/library";
import Link from "next/link";

interface LibraryItemCardProps {
    item: LibraryItemWithSource;
    compact?: boolean;
}

export function LibraryItemCard({ item, compact = false }: LibraryItemCardProps) {
    // Group tags by namespace for display
    const groupedTags = (item.tags || []).reduce((acc, tag) => {
        const ns = tag.namespace;
        if (!acc[ns]) acc[ns] = [];
        acc[ns].push(tag);
        return acc;
    }, {} as Record<string, TagWithOrigin[]>);

    return (
        <Link href={`/library/${item.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                    {item.tldr && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.tldr}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* First section preview */}
                    {!compact && item.sections && item.sections.length > 0 && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">
                                {item.sections[0].heading}
                            </label>
                            <p className="text-sm line-clamp-2 mt-1">
                                {item.sections[0].content}
                            </p>
                            {item.sections.length > 1 && (
                                <p className="text-muted-foreground text-xs mt-1">
                                    +{item.sections.length - 1} more sections
                                </p>
                            )}
                        </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                        {/* Priority: model > api > impl > topic > entity */}
                        {groupedTags["model"]?.slice(0, 2).map(tag => (
                            <Badge key={tag.id} variant="default" className="text-xs">
                                {tag.name.replace("model:", "")}
                            </Badge>
                        ))}
                        {groupedTags["api"]?.slice(0, 2).map(tag => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                                {tag.name.replace("api:", "")}
                            </Badge>
                        ))}
                        {groupedTags["topic"]?.slice(0, 2).map(tag => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                                {tag.name.replace("topic:", "")}
                            </Badge>
                        ))}
                        {groupedTags["entity"]?.slice(0, 2).map(tag => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                                {tag.name.replace("entity:", "")}
                            </Badge>
                        ))}
                    </div>

                    {/* Source URL indicator */}
                    {item.source?.url && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                                {new URL(item.source.url).hostname}
                            </span>
                        </div>
                    )}

                    {/* Date */}
                    <div className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
