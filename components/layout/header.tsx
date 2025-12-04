import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function Header() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    let profile = null;
    if (user) {
        const { data } = await supabase
            .from("profiles")
            .select("display_name, university, avatar_url")
            .eq("id", user.id)
            .single();
        profile = data;
    }

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div className="flex items-center gap-4">
                {/* Breadcrumbs or Page Title could go here */}
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                </Button>
                <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium leading-none">
                            {profile?.display_name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {profile?.university || "Set your university"}
                        </p>
                    </div>
                    <Avatar>
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>
                            {profile?.display_name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </header>
    );
}
