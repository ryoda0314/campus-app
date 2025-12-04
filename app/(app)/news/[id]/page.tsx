import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: news } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .single();

    if (!news) {
        redirect("/news");
    }

    return (
        <div className="max-w-4xl space-y-6">
            <Link
                href="/news"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to News
            </Link>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Badge>{news.tag || "News"}</Badge>
                    <span className="text-sm text-muted-foreground">
                        {news.source} • {new Date(news.created_at).toLocaleDateString()}
                    </span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">{news.title}</h1>

                <div className="flex items-center gap-4 border-y py-4">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Like
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comment
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 ml-auto">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>

                <div className="prose prose-invert max-w-none py-6">
                    {news.content ? (
                        <p>{news.content}</p>
                    ) : (
                        <p className="text-lg text-muted-foreground">
                            (Full article content would be displayed here.)
                        </p>
                    )}
                </div>

                <div className="space-y-6 pt-6">
                    <h3 className="text-xl font-semibold">Comments</h3>
                    <div className="text-center text-muted-foreground py-10">
                        Comments feature coming soon.
                    </div>
                </div>
            </div>
        </div>
    );
}
