import { AppLayout } from "@/components/layout/app-layout";
import { Header } from "@/components/layout/header";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <AppLayout header={<Header />}>{children}</AppLayout>;
}
