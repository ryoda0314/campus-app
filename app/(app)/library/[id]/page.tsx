"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2, Loader2, Edit, Highlighter, Save, X, Code } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLibrary } from "@/hooks/library/useLibrary";
import { LibraryItemWithSource, TagWithOrigin, Highlight } from "@/lib/types/library";
import { ContentRenderer } from "@/components/features/content-renderer";
import { HighlightableText } from "@/components/features/highlightable-text";
import { RelatedItems } from "@/components/features/related-items";
import Link from "next/link";

export default function LibraryItemPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [userId, setUserId] = useState<string | null>(null);
    const [item, setItem] = useState<LibraryItemWithSource | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [highlightMode, setHighlightMode] = useState(false);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [editingSection, setEditingSection] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [saving, setSaving] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    // Get current user (run once on mount)
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        };
        getUser();
    }, [supabase]);

    const { getItem, deleteItem, updateItem } = useLibrary(userId || undefined);

    // Fetch item (only when id changes)
    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;
            setLoading(true);
            const data = await getItem(id);
            setItem(data);
            setHighlights(data?.highlights || []);
            setLoading(false);
        };
        fetchItem();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        setDeleting(true);
        const success = await deleteItem(id);
        if (success) {
            router.push("/library");
        } else {
            setDeleting(false);
        }
    };

    // Start editing a section
    const handleStartEdit = (sectionIndex: number) => {
        if (!item?.sections?.[sectionIndex]) return;
        setEditingSection(sectionIndex);
        setEditContent(item.sections[sectionIndex].content);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingSection(null);
        setEditContent("");
    };

    // Save section edit
    const handleSaveEdit = async () => {
        if (editingSection === null || !item?.sections) return;

        setSaving(true);
        const newSections = [...item.sections];
        newSections[editingSection] = {
            ...newSections[editingSection],
            content: editContent,
        };

        const { error } = await supabase
            .from("library_items")
            .update({ sections: newSections })
            .eq("id", id);

        if (!error) {
            setItem({ ...item, sections: newSections });
            setEditingSection(null);
            setEditContent("");
        }
        setSaving(false);
    };

    // Wrap selected text in code block
    const handleWrapInCodeBlock = () => {
        const textarea = document.getElementById("section-edit-textarea") as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = editContent.substring(start, end);

        if (selectedText) {
            const newContent =
                editContent.substring(0, start) +
                "\n```yaml\n" + selectedText + "\n```\n" +
                editContent.substring(end);
            setEditContent(newContent);
        }
    };

    // Handle adding a highlight
    const handleAddHighlight = useCallback(async (highlight: Omit<Highlight, "id">) => {
        const newHighlight: Highlight = {
            ...highlight,
            id: crypto.randomUUID(),
        };

        const newHighlights = [...highlights, newHighlight];
        setHighlights(newHighlights);

        // Save to database
        await supabase
            .from("library_items")
            .update({ highlights: newHighlights })
            .eq("id", id);
    }, [highlights, id, supabase]);

    // Handle removing a highlight
    const handleRemoveHighlight = useCallback(async (highlightId: string) => {
        const newHighlights = highlights.filter(h => h.id !== highlightId);
        setHighlights(newHighlights);

        // Save to database
        await supabase
            .from("library_items")
            .update({ highlights: newHighlights })
            .eq("id", id);
    }, [highlights, id, supabase]);

    // Group tags by namespace
    const groupedTags = (item?.tags || []).reduce((acc, tag) => {
        const ns = tag.namespace;
        if (!acc[ns]) acc[ns] = [];
        acc[ns].push(tag);
        return acc;
    }, {} as Record<string, TagWithOrigin[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Item not found.</p>
                <Link href="/library">
                    <Button variant="outline" className="mt-4">
                        Back to Library
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back Button */}
            <Link href="/library">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Library
                </Button>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{item.title}</h1>
                            {item.tldr && (
                                <p className="text-muted-foreground mt-1">{item.tldr}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={highlightMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => setHighlightMode(!highlightMode)}
                                className="gap-2"
                            >
                                <Highlighter className="h-4 w-4" />
                                {highlightMode ? "Done" : "Highlight"}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="gap-2"
                            >
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Delete
                            </Button>
                        </div>
                    </div>

                    {/* Source URL */}
                    {item.source?.url && (
                        <Card>
                            <CardContent className="py-3 flex items-center gap-2">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                <a
                                    href={item.source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline truncate"
                                >
                                    {item.source.url}
                                </a>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sections (AI generated) */}
                    {item.sections && item.sections.map((section, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm text-muted-foreground">{section.heading}</CardTitle>
                                {editingSection !== i && !highlightMode && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStartEdit(i)}
                                        className="h-7 gap-1"
                                    >
                                        <Edit className="h-3 w-3" />
                                        Edit
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {editingSection === i ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleWrapInCodeBlock}
                                                className="gap-1"
                                            >
                                                <Code className="h-3 w-3" />
                                                Wrap in Code Block
                                            </Button>
                                            <span className="text-xs text-muted-foreground self-center">
                                                (Select text first)
                                            </span>
                                        </div>
                                        <Textarea
                                            id="section-edit-textarea"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="font-mono text-sm min-h-[300px]"
                                            placeholder="Markdown content..."
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSaveEdit}
                                                disabled={saving}
                                                className="gap-1"
                                            >
                                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                                Save
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCancelEdit}
                                                className="gap-1"
                                            >
                                                <X className="h-3 w-3" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : highlightMode ? (
                                    <HighlightableText
                                        content={section.content}
                                        sectionIndex={i}
                                        highlights={highlights}
                                        onAddHighlight={handleAddHighlight}
                                        onRemoveHighlight={handleRemoveHighlight}
                                    />
                                ) : (
                                    <ContentRenderer content={section.content} />
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Personal Note */}
                    {item.personal_note && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">PERSONAL NOTE</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{item.personal_note}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>Created: {new Date(item.created_at).toLocaleString()}</p>
                        {item.updated_at !== item.created_at && (
                            <p>Updated: {new Date(item.updated_at).toLocaleString()}</p>
                        )}
                        {item.model_name && <p>Model: {item.model_name}</p>}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Tags */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">TAGS</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {Object.keys(groupedTags).length === 0 ? (
                                <p className="text-xs text-muted-foreground">No tags</p>
                            ) : (
                                Object.entries(groupedTags).map(([ns, tags]) => (
                                    <div key={ns}>
                                        <label className="text-xs text-muted-foreground uppercase">{ns}</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {tags.map(tag => (
                                                <Badge key={tag.id} variant="secondary" className="text-xs">
                                                    {tag.name}
                                                    {tag.origin === "ai_new" && (
                                                        <span className="ml-1 opacity-50">(new)</span>
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Related Items */}
                    <RelatedItems itemId={id} limit={5} />
                </div>
            </div>
        </div>
    );
}
