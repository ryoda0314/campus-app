"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Users,
    UsersRound,
    Newspaper,
    Rocket,
    CalendarDays,
    CalendarClock,
    Book,
    MessageCircle,
    User,
    Settings,
    LogOut,
    Menu,
    Bell,
    ChevronDown,
    ChevronRight,
    LayoutGrid,
} from "lucide-react";

const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Rooms", href: "/rooms", icon: Users },
    { name: "DM", href: "/dm", icon: MessageCircle },
    { name: "Members", href: "/members", icon: UsersRound },
];

const featureNavigation = [
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Projects", href: "/projects", icon: Rocket },
    { name: "Events", href: "/events", icon: CalendarDays },
    { name: "Schedule", href: "/schedule", icon: CalendarClock },
    { name: "Library", href: "/library", icon: Book },
];

const systemNavigation = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            console.log("Sidebar: Current User ID", user?.id);
            if (user) {
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                console.log("Sidebar: Profile Fetch", { profile, error });

                // Allow 'admin' role
                if (profile?.role === "admin") {
                    setIsAdmin(true);
                }
            }
        };
        checkAdmin();

        // Listen for profile updates
        const handleProfileUpdate = () => {
            console.log("Sidebar: Profile Updated Event Received");
            checkAdmin();
        };

        window.addEventListener("profile-updated", handleProfileUpdate);
        return () => window.removeEventListener("profile-updated", handleProfileUpdate);
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const finalSystemNavigation = isAdmin
        ? [...systemNavigation, { name: "Admin", href: "/admin", icon: Settings }]
        : systemNavigation;

    // Check if current path is within features to auto-expand
    useEffect(() => {
        if (featureNavigation.some(item => pathname.startsWith(item.href))) {
            setIsFeaturesOpen(true);
        }
    }, [pathname]);

    return (
        <div className="flex flex-col h-full">
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {/* Main Navigation */}
                {mainNavigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}

                {/* Features Dropdown */}
                <div>
                    <button
                        onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                        className={cn(
                            "group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                            isFeaturesOpen ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center">
                            <LayoutGrid className="mr-3 h-5 w-5 flex-shrink-0" />
                            Features
                        </div>
                        {isFeaturesOpen ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>

                    {isFeaturesOpen && (
                        <div className="mt-1 space-y-1 pl-4">
                            {featureNavigation.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors border-l-2 border-transparent",
                                            isActive
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "mr-3 h-4 w-4 flex-shrink-0",
                                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* System Navigation (Separator) */}
                <div className="pt-4 mt-4 border-t">
                    <div className="px-3 mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            System
                        </p>
                    </div>
                    {finalSystemNavigation.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </nav>
            <div className="border-t p-4">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="mr-3 h-5 w-5 flex-shrink-0 group-hover:text-destructive" />
                    Logout
                </button>
            </div>
        </div>
    );
}

// Desktop Sidebar
export function Sidebar() {
    return (
        <div className="hidden md:flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center justify-between px-6">
                <h1 className="text-xl font-bold tracking-tight text-primary">
                    Campus Club
                </h1>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                </Button>
            </div>
            <SidebarContent />
        </div>
    );
}

// Mobile Sidebar (Hamburger Menu)
export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4 space-y-0">
                    <SheetTitle className="text-xl font-bold text-primary">
                        Campus Club
                    </SheetTitle>
                    <Button variant="ghost" size="icon" className="relative mr-8">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                    </Button>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100%-65px)]">
                    <SidebarContent onNavigate={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
