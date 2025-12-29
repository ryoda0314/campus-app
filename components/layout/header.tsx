// Imports removed
import Link from "next/link";
import { MobileSidebar } from "./sidebar";

export async function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
            <div className="flex items-center gap-4">
                <MobileSidebar />
                {/* Mobile logo - shown only on mobile */}
                <Link href="/dashboard" className="md:hidden">
                    <span className="text-lg font-bold text-primary">Campus Club</span>
                </Link>
            </div>
        </header>
    );
}
