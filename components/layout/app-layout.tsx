"use client";

import { Sidebar } from "./sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppLayout({ children, header }: { children: React.ReactNode; header: React.ReactNode }) {
    const pathname = usePathname();
    const isRoomPage = pathname?.startsWith("/rooms/");

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-background">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                {header}
                <main className={cn(
                    "flex-1 overflow-y-auto",
                    isRoomPage ? "p-0 overflow-hidden" : "p-6"
                )}>
                    {children}
                </main>
            </div>
        </div>
    );
}
