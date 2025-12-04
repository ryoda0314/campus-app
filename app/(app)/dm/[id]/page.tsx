import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DMDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: _id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Redirect to DM list since we don't have real DM functionality yet
    redirect("/dm");
}
