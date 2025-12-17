"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RelatedItem {
    id: string;
    title: string;
    tldr: string | null;
    created_at: string;
    matching_tags: string[];
    score: number;
}

interface RelatedItemsProps {
    itemId: string;
    limit?: number;
}

export function RelatedItems({ itemId, limit = 5 }: RelatedItemsProps) {
    const [items, setItems] = useState<RelatedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/library/related?itemId=${itemId}&limit=${limit}`
                );
                const data = await response.json();

                if (data.success) {
                    setItems(data.items || []);
                } else {
                    setError(data.error || "Failed to fetch related items");
                }
            } catch (err) {
                console.error("Failed to fetch related items:", err);
                setError("Failed to fetch related items");
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [itemId, limit]);

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Related Items
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return null; // Silently fail for related items
    }

    if (items.length === 0) {
        return null; // Don't show section if no related items
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Related Items
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/library/${item.id}`}
                        className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                    {item.title}
                                </h4>
                                {item.tldr && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {item.tldr}
                                    </p>
                                )}
                            </div>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {item.score} tags
                            </Badge>
                        </div>
                        {item.matching_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {item.matching_tags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {item.matching_tags.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                        +{item.matching_tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
