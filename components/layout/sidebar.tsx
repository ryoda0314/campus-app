"use client";

import { useState } from "react";
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
    Newspaper,
    Rocket,
    CalendarDays,
    CalendarClock,
    MessageCircle,
    User,
    Settings,
    LogOut,
    Menu,
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Rooms", href: "/rooms", icon: Users },
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Projects", href: "/projects", icon: Rocket },
    { name: "Events", href: "/events", icon: CalendarDays },
    { name: "Schedule", href: "/schedule", icon: CalendarClock },
    { name: "DM", href: "/dm", icon: MessageCircle },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
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
        </>
    );
}

// Desktop Sidebar
export function Sidebar() {
    return (
        <div className="hidden md:flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center px-6">
                <h1 className="text-xl font-bold tracking-tight text-primary">
                    Campus Club
                </h1>
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
                <SheetHeader className="border-b px-6 py-4">
                    <SheetTitle className="text-xl font-bold text-primary">
                        Campus Club
                    </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100%-65px)]">
                    <SidebarContent onNavigate={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
