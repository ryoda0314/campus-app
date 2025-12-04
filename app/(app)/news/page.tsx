import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateNewsDialog } from "@/components/features/create-news-dialog";

export default async function NewsPage() {
    const supabase = await createClient();
    const { data: news } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">News & Knowledge</h2>
                    <p className="text-muted-foreground">
                        Curated updates for ambitious students.
                    </p>
                </div>
                <CreateNewsDialog />
            </div>

            <div className="grid gap-4">
                {news?.map((item) => (
                    <Link key={item.id} href={`/news/${item.id}`}>
                        <Card className="transition-colors hover:bg-accent/50">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{item.tags?.[0] || item.tag || "News"}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {item.source} • {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-semibold">{item.title}</h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <ThumbsUp className="h-4 w-4" />
                                                {/* Mock reaction count */}
                                                <span>{Math.floor(Math.random() * 50)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-4 w-4" />
                                                {/* Mock comment count */}
                                                <span>{Math.floor(Math.random() * 10)} comments</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {(!news || news.length === 0) && (
                    <div className="text-center text-muted-foreground py-10">
                        No news available at the moment.
                    </div>
                )}
            </div>
        </div>
    );
}
