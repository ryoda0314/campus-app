import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Bell, Lock, User } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            <CardTitle>Language</CardTitle>
                        </div>
                        <CardDescription>
                            Select your preferred language for the interface.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Button variant="default">English</Button>
                            <Button variant="outline">日本語</Button>
                            <Button variant="outline">한국어</Button>
                            <Button variant="outline">中文</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <CardTitle>Profile Visibility</CardTitle>
                        </div>
                        <CardDescription>
                            Control who can see your profile and activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <div className="font-medium">Public Profile</div>
                                <div className="text-sm text-muted-foreground">
                                    Allow other members to see your profile details.
                                </div>
                            </div>
                            <Badge>Enabled</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <div className="font-medium">Show Activity Rank</div>
                                <div className="text-sm text-muted-foreground">
                                    Display your activity rank on your profile.
                                </div>
                            </div>
                            <Badge>Enabled</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>
                            Configure how you receive notifications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Email Notifications</span>
                                <Button variant="outline" size="sm">Configure</Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Push Notifications</span>
                                <Button variant="outline" size="sm">Configure</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
