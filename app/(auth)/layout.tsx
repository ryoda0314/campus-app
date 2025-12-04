export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">
                        Campus Club
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Exclusive community for ambitious students.
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
