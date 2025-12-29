import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { RoomActions } from "./_components/room-actions";

export default async function AdminRoomsPage() {
    const supabase = await createClient();

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: rooms, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Admin Rooms Error:", error);
        return <div>Error loading rooms</div>;
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Room Management</h2>
            </div>

            <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created At</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {rooms.map((room) => (
                                <tr key={room.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle font-medium">
                                        {room.name}
                                    </td>
                                    <td className="p-4 align-middle text-muted-foreground md:max-w-[300px] truncate">
                                        {room.description}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {room.created_at ? format(new Date(room.created_at), 'yyyy-MM-dd') : '-'}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <RoomActions roomId={room.id} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
