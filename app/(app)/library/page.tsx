"use client";

import { useEffect, useState, useMemo } from "react";
import { Book, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLibrary } from "@/hooks/library/useLibrary";
import { LibraryIngestDialog } from "@/components/features/library-ingest-dialog";
import { LibraryBrowser } from "@/components/features/library-browser";
import { LibraryItemCard } from "@/components/features/library-item-card";

export default function LibraryPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    // Get current user (run once on mount)
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        };
        getUser();
    }, [supabase]);

    const { items, loading, error, filter, setFilter, refetch } = useLibrary(userId || undefined);

    if (!userId) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Book className="h-8 w-8" />
                        Library
                    </h2>
                    <p className="text-muted-foreground">
                        Your knowledge assets, transformed and tagged.
                    </p>
                </div>
                <LibraryIngestDialog userId={userId} onCreated={refetch} />
            </div>

            {/* Browser (Filters) */}
            <LibraryBrowser filter={filter} onFilterChange={setFilter} />

            {/* Items Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <div className="text-center text-muted-foreground py-10">
                    Failed to load items. Please try again.
                </div>
            ) : items.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    <p>No items in your library yet.</p>
                    <p className="text-sm">Click "Add to Library" to get started.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                        <LibraryItemCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
