"use client";

import { useState } from "react";
import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTags, BROWSE_CATEGORIES } from "@/hooks/library/useTags";
import { BrowseCategory, BrowseFilter, TagNamespace } from "@/lib/types/library";

interface LibraryBrowserProps {
    filter: BrowseFilter;
    onFilterChange: (filter: BrowseFilter) => void;
}

export function LibraryBrowser({ filter, onFilterChange }: LibraryBrowserProps) {
    const [selectedCategory, setSelectedCategory] = useState<BrowseCategory | null>(
        filter.category || null
    );
    const [searchQuery, setSearchQuery] = useState(filter.search || "");
    const { tags } = useTags();

    // Get tags for selected category
    const getCategoryTags = (category: BrowseCategory) => {
        const config = BROWSE_CATEGORIES[category];
        return tags.filter(t => config.namespaces.includes(t.namespace as TagNamespace));
    };

    // Handle category selection
    const handleCategoryClick = (category: BrowseCategory) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
            onFilterChange({ ...filter, category: undefined, tags: [] });
        } else {
            setSelectedCategory(category);
            onFilterChange({ ...filter, category, tags: [] });
        }
    };

    // Handle tag selection
    const handleTagClick = (tagName: string) => {
        const currentTags = filter.tags || [];
        const newTags = currentTags.includes(tagName)
            ? currentTags.filter(t => t !== tagName)
            : [...currentTags, tagName];
        onFilterChange({ ...filter, tags: newTags });
    };

    // Handle search
    const handleSearch = () => {
        onFilterChange({ ...filter, search: searchQuery || undefined });
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedCategory(null);
        setSearchQuery("");
        onFilterChange({});
    };

    // Group tags by sub-category (e.g., prompt:intent:*, prompt:format:*)
    const groupTagsByPrefix = (tagList: typeof tags) => {
        const groups: Record<string, typeof tags> = {};
        tagList.forEach(tag => {
            const parts = tag.name.split(":");
            if (parts.length >= 2) {
                const prefix = parts.slice(0, 2).join(":");
                if (!groups[prefix]) groups[prefix] = [];
                groups[prefix].push(tag);
            }
        });
        return groups;
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
                    />
                </div>
                <Button variant="outline" onClick={handleSearch}>
                    Search
                </Button>
                {(filter.tags?.length || filter.search || filter.category) && (
                    <Button variant="ghost" onClick={clearFilters}>
                        Clear
                    </Button>
                )}
            </div>

            {/* Browse by Categories */}
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    BROWSE BY
                </label>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(BROWSE_CATEGORIES) as BrowseCategory[]).map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCategoryClick(cat)}
                        >
                            {BROWSE_CATEGORIES[cat].label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Category Tags (Shelf) */}
            {selectedCategory && (
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">
                            {BROWSE_CATEGORIES[selectedCategory].label} Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.entries(groupTagsByPrefix(getCategoryTags(selectedCategory))).map(
                            ([prefix, groupTags]) => (
                                <div key={prefix}>
                                    <label className="text-xs text-muted-foreground uppercase">
                                        {prefix.split(":")[1]}
                                    </label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {groupTags.map(tag => (
                                            <Badge
                                                key={tag.id}
                                                variant={filter.tags?.includes(tag.name) ? "default" : "outline"}
                                                className="text-xs cursor-pointer"
                                                onClick={() => handleTagClick(tag.name)}
                                            >
                                                {tag.name.split(":").pop()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Active Filters Display */}
            {filter.tags && filter.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    {filter.tags.map(tag => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs cursor-pointer"
                            onClick={() => handleTagClick(tag)}
                        >
                            {tag} ×
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
