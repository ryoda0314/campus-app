import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DMPageContent } from "@/components/features/dm-page-content";

export default async function DMPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return <DMPageContent currentUserId={user.id} />;
}
