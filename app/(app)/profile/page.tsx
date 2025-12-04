import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfileRedirectPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Redirect to the user's own profile page
    redirect(`/profile/${user.id}`);
}
