import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Rocket } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateProjectDialog } from "@/components/features/create-project-dialog";

export default async function ProjectsPage() {
    const supabase = await createClient();

    const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">
                        Collaborate and build together.
                    </p>
                </div>
                <CreateProjectDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects?.map((project) => (
                    <Card key={project.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Badge>
                                    <Rocket className="h-3 w-3 mr-1" /> Project
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {project.status || "Recruiting"}
                                </span>
                            </div>
                            <CardTitle className="mt-2 text-xl">{project.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="mt-auto space-y-4">
                            {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {project.description}
                                </p>
                            )}
                            <Link href={`/projects/${project.id}`}>
                                <Button variant="outline" className="w-full gap-2">
                                    View Details <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                {(!projects || projects.length === 0) && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No projects found. Be the first to create one!
                    </div>
                )}
            </div>
        </div>
    );
}
