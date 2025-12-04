"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Bell, Lock, User, Palette, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_COLORS = [
    { name: "Green", value: "", color: "bg-green-500" },
    { name: "Blue", value: "theme-blue", color: "bg-blue-500" },
    { name: "Purple", value: "theme-purple", color: "bg-purple-500" },
    { name: "Orange", value: "theme-orange", color: "bg-orange-500" },
    { name: "Rose", value: "theme-rose", color: "bg-rose-500" },
];

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [colorTheme, setColorTheme] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load saved color theme from localStorage
        const savedColorTheme = localStorage.getItem("color-theme") || "";
        setColorTheme(savedColorTheme);
        // Apply to document
        document.documentElement.classList.remove(...THEME_COLORS.map(t => t.value).filter(v => v));
        if (savedColorTheme) {
            document.documentElement.classList.add(savedColorTheme);
        }
    }, []);

    const handleColorThemeChange = (value: string) => {
        setColorTheme(value);
        localStorage.setItem("color-theme", value);
        // Remove all theme classes and add the new one
        document.documentElement.classList.remove(...THEME_COLORS.map(t => t.value).filter(v => v));
        if (value) {
            document.documentElement.classList.add(value);
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Appearance Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            <CardTitle>Appearance</CardTitle>
                        </div>
                        <CardDescription>
                            Customize the look and feel of the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Dark/Light Mode */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Mode</label>
                            <div className="flex gap-2">
                                <Button
                                    variant={theme === "light" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTheme("light")}
                                    className="gap-2"
                                >
                                    <Sun className="h-4 w-4" />
                                    Light
                                </Button>
                                <Button
                                    variant={theme === "dark" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTheme("dark")}
                                    className="gap-2"
                                >
                                    <Moon className="h-4 w-4" />
                                    Dark
                                </Button>
                                <Button
                                    variant={theme === "system" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTheme("system")}
                                    className="gap-2"
                                >
                                    <Monitor className="h-4 w-4" />
                                    System
                                </Button>
                            </div>
                        </div>

                        {/* Color Theme */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Theme Color</label>
                            <div className="flex gap-3">
                                {THEME_COLORS.map((t) => (
                                    <button
                                        key={t.name}
                                        onClick={() => handleColorThemeChange(t.value)}
                                        className={cn(
                                            "flex flex-col items-center gap-1.5 group"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "h-10 w-10 rounded-full transition-all",
                                                t.color,
                                                colorTheme === t.value
                                                    ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                                                    : "hover:scale-105"
                                            )}
                                        />
                                        <span className={cn(
                                            "text-xs",
                                            colorTheme === t.value ? "font-medium" : "text-muted-foreground"
                                        )}>
                                            {t.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
