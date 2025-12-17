"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    NewsPostWithAuthor,
    DigestItemWithSummary,
    DigestDailyMemo,
    NewsCategory
} from "@/lib/types/news";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Loader2,
    Plus,
    Newspaper,
    Rss,
    ExternalLink,
    Clock,
    Share2
} from "lucide-react";
import Link from "next/link";
import { CreateNewsDialog } from "@/components/features/create-news-dialog";
import { ShareNewsDialog } from "@/components/features/share-news-dialog";

const CATEGORIES: { value: NewsCategory | "all"; label: string }[] = [
    { value: "all", label: "すべて" },
    { value: "notice", label: "お知らせ" },
    { value: "event", label: "イベント" },
    { value: "recruit", label: "募集" },
    { value: "lost", label: "落とし物" },
    { value: "study", label: "学習" },
];

function NewsCard({ post }: { post: NewsPostWithAuthor }) {
    const isExpiring = post.expires_at && new Date(post.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000);
    const isPinned = post.pinned_until && new Date(post.pinned_until) > new Date();

    return (
        <Link href={`/news/${post.id}?type=campus`}>
            <Card className={`hover:bg-muted/50 transition-colors cursor-pointer ${isPinned ? 'border-primary' : ''}`}>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author?.avatar_url || undefined} />
                            <AvatarFallback>
                                {post.author?.display_name?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                    {CATEGORIES.find(c => c.value === post.category)?.label || post.category}
                                </Badge>
                                {isPinned && <Badge variant="default" className="text-xs">📌 固定</Badge>}
                                {isExpiring && <Badge variant="destructive" className="text-xs">⏰ まもなく締切</Badge>}
                            </div>
                            <h3 className="font-semibold truncate">{post.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{post.author?.display_name || "匿名"}</span>
                                <span>•</span>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function DigestCard({ item }: { item: DigestItemWithSummary }) {
    const [shareOpen, setShareOpen] = useState(false);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "bg-red-500";
        if (score >= 60) return "bg-orange-500";
        if (score >= 40) return "bg-yellow-500";
        return "bg-gray-400";
    };

    return (
        <>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                    {item.source}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${getScoreColor(item.importance)} text-white border-0`}>
                                    {item.importance}
                                </Badge>
                                {item.importance >= 70 && (
                                    <Badge variant="default" className="text-xs">🔥</Badge>
                                )}
                            </div>
                            <Link href={`/news/${item.id}?type=digest`}>
                                <h3 className="font-semibold line-clamp-2 hover:underline">{item.title}</h3>
                            </Link>
                            {item.summary && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {item.summary.summary_short}
                                </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(item.published_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShareOpen(true);
                                        }}
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <ShareNewsDialog
                open={shareOpen}
                onOpenChange={setShareOpen}
                newsTitle={item.title}
                newsUrl={item.url}
                newsId={item.id}
                newsType="digest"
            />
        </>
    );
}

function NewsHubContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab") || "campus";
    const [category, setCategory] = useState<NewsCategory | "all">("all");

    const [campusNews, setCampusNews] = useState<NewsPostWithAuthor[]>([]);
    const [digestItems, setDigestItems] = useState<DigestItemWithSummary[]>([]);
    const [dailyMemo, setDailyMemo] = useState<DigestDailyMemo | null>(null);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | undefined>();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [digestSort, setDigestSort] = useState<"date" | "importance">("importance");
    const [digestDays, setDigestDays] = useState<number>(7);

    const fetchNews = useCallback(async (newTab?: string, reset = false) => {
        setLoading(true);
        const currentTab = newTab || tab;

        const params = new URLSearchParams();
        params.set("tab", currentTab);
        if (currentTab === "campus" && category !== "all") {
            params.set("category", category);
        }
        if (currentTab === "digest") {
            params.set("sort", digestSort);
            params.set("days", String(digestDays));
        }
        if (!reset && nextCursor) {
            params.set("cursor", nextCursor);
        }

        const res = await fetch(`/api/news?${params.toString()}`);
        if (res.ok) {
            const data = await res.json();
            if (currentTab === "campus") {
                setCampusNews(reset ? data.items : [...campusNews, ...data.items]);
            } else {
                setDigestItems(reset ? data.items : [...digestItems, ...data.items]);
                if (data.memo) setDailyMemo(data.memo);
            }
            setNextCursor(data.nextCursor);
        }
        setLoading(false);
    }, [tab, category, nextCursor, campusNews, digestItems, digestSort, digestDays]);

    useEffect(() => {
        fetchNews(tab, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, category, digestSort, digestDays]);

    const handleTabChange = (newTab: string) => {
        router.push(`/news?tab=${newTab}`);
    };

    const handleNewsCreated = () => {
        setCreateDialogOpen(false);
        fetchNews("campus", true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">News Hub</h1>
                    <p className="text-muted-foreground">学内ニュースと最新情報</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    投稿する
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="campus" className="gap-2">
                        <Newspaper className="h-4 w-4" />
                        Campus
                    </TabsTrigger>
                    <TabsTrigger value="digest" className="gap-2">
                        <Rss className="h-4 w-4" />
                        Digest
                    </TabsTrigger>
                </TabsList>

                {/* Campus Tab */}
                <TabsContent value="campus" className="space-y-4">
                    {/* Filter */}
                    <div className="flex gap-2">
                        <Select value={category} onValueChange={(v) => setCategory(v as NewsCategory | "all")}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="カテゴリ" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* News List */}
                    {loading && campusNews.length === 0 ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : campusNews.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>ニュースがありません</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {campusNews.map((post) => (
                                <NewsCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}

                    {nextCursor && !loading && (
                        <Button variant="outline" onClick={() => fetchNews()} className="w-full">
                            もっと読み込む
                        </Button>
                    )}
                </TabsContent>

                {/* Digest Tab */}
                <TabsContent value="digest" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <Select value={digestSort} onValueChange={(v) => setDigestSort(v as "date" | "importance")}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="並び順" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="importance">🔥 重要度順</SelectItem>
                                <SelectItem value="date">📅 新着順</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={String(digestDays)} onValueChange={(v) => setDigestDays(parseInt(v))}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="期間" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">過去1日</SelectItem>
                                <SelectItem value="3">過去3日</SelectItem>
                                <SelectItem value="7">過去7日</SelectItem>
                                <SelectItem value="14">過去14日</SelectItem>
                                <SelectItem value="30">過去30日</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Daily Memo */}
                    {dailyMemo && (
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    📋 Today's Summary
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {new Date(dailyMemo.generated_at).toLocaleString()}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{dailyMemo.memo_text}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Digest List */}
                    {loading && digestItems.length === 0 ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : digestItems.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>ダイジェストがありません</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {digestItems.map((item) => (
                                <DigestCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}

                    {nextCursor && !loading && (
                        <Button variant="outline" onClick={() => fetchNews()} className="w-full">
                            もっと読み込む
                        </Button>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Dialog */}
            <CreateNewsDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleNewsCreated}
            />
        </div>
    );
}

export default function NewsHubPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <NewsHubContent />
        </Suspense>
    );
}
