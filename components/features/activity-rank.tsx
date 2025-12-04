import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface ActivityRankProps {
    rank: number;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function ActivityRank({ rank, className, size = "md" }: ActivityRankProps) {
    const sizeClasses = {
        sm: "h-6 w-6 text-xs",
        md: "h-8 w-8 text-sm",
        lg: "h-12 w-12 text-lg",
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className={cn(
                    "relative flex items-center justify-center rounded-full bg-primary/20 font-bold text-primary ring-2 ring-primary/50",
                    sizeClasses[size]
                )}
            >
                {rank}
                <Zap
                    className={cn(
                        "absolute -right-1 -top-1 fill-primary text-primary",
                        size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"
                    )}
                />
            </div>
            {size !== "sm" && (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                        Activity Rank
                    </span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${(rank / 5) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
