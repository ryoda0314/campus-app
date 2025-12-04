import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { ActivityRank } from "@/components/features/activity-rank";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: project } = await supabase
        .from("projects")
        .select(`
            *,
            profiles:created_by (
                display_name,
                avatar_url
            )
        `)
        .eq("id", id)
        .single();

    if (!project) {
        redirect("/projects");
    }

    return (
        <div className="space-y-6">
            <Link
                href="/projects"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
            </Link>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge>{project.type || "Event"}</Badge>
                            <Badge variant="outline">Open</Badge>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {project.date ? new Date(project.date).toLocaleDateString() : "TBD"}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {project.location || "TBD"}
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {project.description ? (
                                <p>{project.description}</p>
                            ) : (
                                <p className="text-muted-foreground">No description provided.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organizer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={project.profiles?.avatar_url || undefined} />
                                    <AvatarFallback>
                                        {project.profiles?.display_name?.[0] || "O"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">
                                        {project.profiles?.display_name || "Anonymous"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Organizer</div>
                                </div>
                            </div>
                            <Button className="w-full mt-4 gap-2" variant="outline">
                                <MessageCircle className="h-4 w-4" /> Contact Organizer
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full">Join Event</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
