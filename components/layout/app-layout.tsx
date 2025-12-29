"use client";

import { Sidebar } from "./sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";

export function AppLayout({ children, header }: { children: React.ReactNode; header: React.ReactNode }) {
    const pathname = usePathname();
    const isRoomPage = pathname?.startsWith("/rooms/");
    const [userId, setUserId] = useState<string>();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUser();
    }, [supabase]);

    useGlobalNotifications(userId);

    return (
        <div className="flex fixed inset-0 overflow-hidden bg-background">
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
