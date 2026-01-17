import { ProfileDropdown } from "./ProfileDropdown";
import { UserData } from "../types";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
    userData: UserData;
    onSettingsClick: () => void;
    onSignOut: () => Promise<void>;
    className?: string;
}

export function DashboardHeader({
    userData,
    onSettingsClick,
    onSignOut,
    className,
}: DashboardHeaderProps) {
    return (
        <header className={cn("flex h-14 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-zinc-800/30 px-4", className)}>
            <div className="flex items-center gap-2">
                {/* Trigger moved to sidebar */}
            </div>

            <ProfileDropdown
                userData={userData}
                onSettingsClick={onSettingsClick}
                onSignOut={onSignOut}
            />
        </header>
    );
}
