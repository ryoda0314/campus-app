"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Search, Loader2, ArrowRight, Calendar, User, Image, Link } from "lucide-react";
import { useChatSearch } from "@/hooks/chat";
import { ChatSearchFilters, ChatSearchResult } from "@/lib/types/chat";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface SearchPanelProps {
    roomId: string;
    onClose: () => void;
    onJumpToMessage?: (messageId: string) => void;
}

export function SearchPanel({ roomId, onClose, onJumpToMessage }: SearchPanelProps) {
    const { results, loading, error, search, clearResults } = useChatSearch(roomId);
    const [query, setQuery] = useState("");
    const [hasImages, setHasImages] = useState(false);
    const [hasLinks, setHasLinks] = useState(false);

    const handleSearch = useCallback(() => {
        if (!query.trim()) return;

        const filters: ChatSearchFilters = {
            query: query.trim(),
            hasImages: hasImages || undefined,
            hasLinks: hasLinks || undefined,
        };

        search(filters);
    }, [query, hasImages, hasLinks, search]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleClear = () => {
        setQuery("");
        clearResults();
    };

    const renderResult = (result: ChatSearchResult) => {
        const timeAgo = formatDistanceToNow(new Date(result.created_at), { addSuffix: true, locale: ja });

        return (
            <div
                key={result.id}
                className="p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                onClick={() => onJumpToMessage?.(result.id)}
            >
                <div className="flex items-start gap-2">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={result.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                            {result.profiles?.display_name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-xs">
                                {result.profiles?.display_name || "Anonymous"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {timeAgo}
                            </span>
                        </div>
                        <p className="text-sm line-clamp-2">
                            {result.content}
                        </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-card border-l">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    検索
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Search input */}
            <div className="p-4 border-b space-y-3">
                <div className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="メッセージを検索..."
                        className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={hasImages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHasImages(!hasImages)}
                        className="h-7 text-xs gap-1"
                    >
                        <Image className="h-3 w-3" />
                        画像あり
                    </Button>
                    <Button
                        variant={hasLinks ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHasLinks(!hasLinks)}
                        className="h-7 text-xs gap-1"
                    >
                        <Link className="h-3 w-3" />
                        リンクあり
                    </Button>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <p className="text-sm text-destructive text-center py-8">
                        {error}
                    </p>
                ) : results.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {query ? "検索結果がありません" : "検索ワードを入力してください"}
                    </p>
                ) : (
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-3">
                            {results.length} 件の結果
                        </p>
                        {results.map(renderResult)}
                    </div>
                )}
            </div>

            {/* Clear button */}
            {results.length > 0 && (
                <div className="p-4 border-t">
                    <Button variant="outline" className="w-full" onClick={handleClear}>
                        検索をクリア
                    </Button>
                </div>
            )}
        </div>
    );
}
