"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Shield, ShieldAlert, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface MemberActionsProps {
    profile: any;
    currentUserId: string;
}

export function MemberActions({ profile, currentUserId }: MemberActionsProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleRoleChange = async (newRole: "admin" | "user") => {
        if (loading) return;
        setLoading(true);

        try {
            const { error } = await supabase.rpc("update_user_role", {
                target_user_id: profile.id,
                new_role: newRole,
            });

            if (error) {
                console.error("Failed to update role:", error);
                alert("Failed to update role");
            } else {
                router.refresh();
            }
        } catch (e) {
            console.error(e);
            alert("Error updating role");
        } finally {
            setLoading(false);
        }
    };

    // Prevent editing own role to avoid locking yourself out (optional safety)
    if (profile.id === currentUserId) {
        return <span className="text-xs text-muted-foreground italic">You</span>;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profile.role === "user" ? (
                    <DropdownMenuItem onClick={() => handleRoleChange("admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Make Admin
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => handleRoleChange("user")}>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Remove Admin
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
