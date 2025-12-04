"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    Users,
    Newspaper,
    Rocket,
    CalendarDays,
    MessageCircle,
    User,
    Settings,
    LogOut,
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Rooms", href: "/rooms", icon: Users },
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Projects", href: "/projects", icon: Rocket },
    { name: "Events", href: "/events", icon: CalendarDays },
    { name: "DM", href: "/dm", icon: MessageCircle },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center px-6">
                <h1 className="text-xl font-bold tracking-tight text-primary">
                    Campus Club
                </h1>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
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
