"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NewsPostWithAuthor, DigestItemWithSummary } from "@/lib/types/news";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ArrowLeft,
    ExternalLink,
    BookmarkPlus,
    Share2,
    Trash2,
    Edit,
    Loader2,
    Book,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { ContentRenderer } from "@/components/features/content-renderer";
import { RelatedItems } from "@/components/features/related-items";
import { ShareNewsDialog } from "@/components/features/share-news-dialog";

const CATEGORIES: Record<string, string> = {
    notice: "お知らせ",
    event: "イベント",
    recruit: "募集",
    lost: "落とし物",
    study: "学習",
    external: "外部",
};

export default function NewsDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params.id as string;
    const type = searchParams.get("type") || "campus";

    const [news, setNews] = useState<NewsPostWithAuthor | null>(null);
    const [digest, setDigest] = useState<DigestItemWithSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // Fetch news/digest
            const res = await fetch(`/api/news/${id}?type=${type}`);
            if (res.ok) {
                const data = await res.json();
                if (type === "campus") {
                    setNews(data);
                } else {
                    setDigest(data);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [id, type, supabase]);

    const handleSaveToLibrary = async () => {
        if (!news) return;
        setSaving(true);
        const res = await fetch(`/api/news/${id}/save-to-library`, {
            method: "POST",
        });
        if (res.ok) {
            const data = await res.json();
            setNews({ ...news, library_item_id: data.library_item_id });
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm("このニュースを削除しますか？")) return;
        setDeleting(true);
        const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
        if (res.ok) {
            router.push("/news");
        }
        setDeleting(false);
    };

    const isAuthor = news && currentUserId === news.author_id;

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (type === "campus" && news) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Link
                    href="/news"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to News
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge>{CATEGORIES[news.category] || news.category}</Badge>
                                {news.expires_at && (
                                    <Badge variant="outline" className="gap-1">
                                        <Calendar className="h-3 w-3" />
                                        締切: {new Date(news.expires_at).toLocaleDateString()}
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold">{news.title}</h1>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={news.author?.avatar_url || undefined} />
                                    <AvatarFallback>{news.author?.display_name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm">
                                    <p className="font-medium">{news.author?.display_name || "匿名"}</p>
                                    <p className="text-muted-foreground">
                                        {new Date(news.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 border-y py-4">
                            {news.library_item_id ? (
                                <Link href={`/library/${news.library_item_id}`}>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Book className="h-4 w-4" />
                                        Open in Library
                                    </Button>
                                </Link>
                            ) : isAuthor && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleSaveToLibrary}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                                    Save to Library
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShareDialogOpen(true)}>
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                            {isAuthor && (
                                <>
                                    <div className="flex-1" />
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div className="prose prose-invert max-w-none">
                            {news.body ? (
                                <ContentRenderer content={news.body} />
                            ) : (
                                <p className="text-muted-foreground">(本文なし)</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {news.library_item_id ? (
                            <RelatedItems itemId={news.library_item_id} limit={5} />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Related</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Library に保存すると関連アイテムが表示されます
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Share Dialog */}
                <ShareNewsDialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                    newsTitle={news.title}
                    newsId={id}
                    newsType="campus"
                />
            </div>
        );
    }

    if (type === "digest" && digest) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Link
                    href="/news?tab=digest"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Digest
                </Link>

                <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{digest.source}</Badge>
                            {digest.importance >= 70 && <Badge>🔥 重要</Badge>}
                        </div>
                        <h1 className="text-3xl font-bold">{digest.title}</h1>
                        <p className="text-muted-foreground">
                            {new Date(digest.published_at).toLocaleString()}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-y py-4">
                        <a href={digest.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ExternalLink className="h-4 w-4" />
                                記事を開く
                            </Button>
                        </a>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    </div>

                    {/* Summary */}
                    <div className="prose prose-invert max-w-none">
                        {digest.summary ? (
                            <>
                                <h2>要約</h2>
                                <p>{digest.summary.summary_long || digest.summary.summary_short}</p>
                                {digest.summary.tags && digest.summary.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4 not-prose">
                                        {digest.summary.tags.map((tag, i) => (
                                            <Badge key={i} variant="outline">{tag}</Badge>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p>{digest.raw_excerpt || "(要約なし)"}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="text-center py-20 text-muted-foreground">
            ニュースが見つかりません
        </div>
    );
}
