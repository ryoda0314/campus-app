import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityRank } from "@/components/features/activity-rank";
import { EditProfileDialog } from "@/components/features/edit-profile-dialog";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user to check if viewing own profile
    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Get profile data
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    if (!profile) {
        redirect("/dashboard");
    }

    const isOwnProfile = currentUser?.id === id;

    return (
        <div className="space-y-6">
            <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
            </div>

            <div className="relative px-6">
                <div className="absolute -top-16 flex items-end gap-6">
                    <Avatar className="h-32 w-32 border-4 border-background">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                            {profile.display_name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="mb-2 space-y-1">
                        <h1 className="text-3xl font-bold">
                            {profile.display_name || "Anonymous"}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            {profile.university && <span>{profile.university}</span>}
                            {profile.university && profile.faculty && <span>•</span>}
                            {profile.faculty && <span>{profile.faculty}</span>}
                            {(profile.university || profile.faculty) && profile.grade && <span>•</span>}
                            {profile.grade && <span>{profile.grade}</span>}
                        </div>
                    </div>
                </div>
                {isOwnProfile && (
                    <div className="flex justify-end pt-4">
                        <EditProfileDialog profile={profile} />
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3 pt-8">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Rank</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center gap-4 py-4">
                                <ActivityRank rank={profile.activity_rank || 1} size="lg" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.goal && (
                                <div className="space-y-2">
                                    <h4 className="font-medium">Current Goal</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {profile.goal}
                                    </p>
                                </div>
                            )}
                            {profile.interests && profile.interests.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium">Interests</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests.map((interest: string, i: number) => (
                                            <Badge key={i} variant="secondary">
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!profile.goal && (!profile.interests || profile.interests.length === 0) && (
                                <p className="text-sm text-muted-foreground">
                                    No information available.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center text-muted-foreground py-10">
                                Activity timeline coming soon.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
