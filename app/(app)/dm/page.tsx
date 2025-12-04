import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DMPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // DM functionality requires a dedicated messages/conversations table
    // For now, show a placeholder

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground py-10">
                        <p>Direct messaging is coming soon.</p>
                        <p className="text-sm mt-2">Use Room chats for now to communicate with others.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
