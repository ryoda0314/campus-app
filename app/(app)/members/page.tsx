"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users } from "lucide-react";
import Link from "next/link";

interface Member {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    university: string | null;
    faculty: string | null;
    grade: string | null;
    goal: string | null;
    interests: string[] | null;
    activity_rank: number | null;
    created_at: string;
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("id, display_name, avatar_url, university, faculty, grade, goal, interests, activity_rank, created_at")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setMembers(data);
            }
            setLoading(false);
        };

        fetchMembers();
    }, [supabase]);

    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return members;
        const query = searchQuery.toLowerCase();
        return members.filter(m =>
            m.display_name?.toLowerCase().includes(query) ||
            m.university?.toLowerCase().includes(query) ||
            m.faculty?.toLowerCase().includes(query) ||
            m.interests?.some(i => i.toLowerCase().includes(query))
        );
    }, [members, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        Members
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {members.length} registered members
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, university, or interests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Members Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No members found.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers.map((member) => (
                        <Link key={member.id} href={`/profile/${member.id}`}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={member.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {member.display_name?.[0] || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">
                                                {member.display_name || "Anonymous"}
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {[member.university, member.faculty, member.grade]
                                                    .filter(Boolean)
                                                    .join(" • ") || "No info"}
                                            </p>
                                            {member.interests && member.interests.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {member.interests.slice(0, 3).map((interest, i) => (
                                                        <Badge key={i} variant="secondary" className="text-xs">
                                                            {interest}
                                                        </Badge>
                                                    ))}
                                                    {member.interests.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{member.interests.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
