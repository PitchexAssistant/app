"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Users, Settings, LogOut, ChevronDown, HelpCircle, Sparkles, ArrowUpRight } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserData } from "../types";
import { DASHBOARD_COPY } from "../constants";
import { useRouter } from "next/navigation";

// Vibrant color palette for avatar fallbacks
const AVATAR_COLORS = [
    { bg: "#FF6B00", text: "#FFFFFF" }, // Voltage Orange
    { bg: "#D437A0", text: "#FFFFFF" }, // Magenta
    { bg: "#5861F8", text: "#FFFFFF" }, // Purple
    { bg: "#00F5AB", text: "#0A0A0A" }, // Green
    { bg: "#FBFF50", text: "#0A0A0A" }, // Accent Lime
    { bg: "#3B82F6", text: "#FFFFFF" }, // Blue
    { bg: "#EF4444", text: "#FFFFFF" }, // Red
    { bg: "#FFC400", text: "#0A0A0A" }, // Yellow
];

// Generate a consistent color based on user name
function getAvatarColor(name: string): { bg: string; text: string } {
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface ProfileAvatarProps {
    avatar?: string;
    name: string;
    initials: string;
    size: "sm" | "md";
}

function ProfileAvatar({ avatar, name, initials, size }: ProfileAvatarProps) {
    const avatarColor = useMemo(() => getAvatarColor(name), [name]);
    const sizeClasses = size === "sm" ? "w-10 h-10" : "w-11 h-11";
    const textSize = size === "sm" ? "text-sm" : "text-base";

    if (avatar) {
        return (
            <div className={`${sizeClasses} rounded-full overflow-hidden flex-shrink-0`}>
                <Image
                    src={avatar}
                    alt={name}
                    width={size === "sm" ? 40 : 44}
                    height={size === "sm" ? 40 : 44}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={`${sizeClasses} rounded-full inline-flex flex-col justify-center items-center flex-shrink-0`}
            style={{ backgroundColor: avatarColor.bg }}
        >
            <div className={`${textSize} font-semibold`} style={{ color: avatarColor.text }}>
                {initials}
            </div>
        </div>
    );
}

interface ProfileDropdownProps {
    userData: UserData;
    onSettingsClick: () => void;
    onSignOut: () => Promise<void>;
}

export function ProfileDropdown({
    userData,
    onSettingsClick,
    onSignOut,
}: ProfileDropdownProps) {
    const router = useRouter();
    const initials =
        userData.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "U";

    const MENU_ITEM_CLASSES = "group px-4 py-2.5 text-[var(--text-primary)] hover:bg-[var(--surface-2)] cursor-pointer focus:bg-[var(--surface-2)] focus:text-[var(--text-primary)]";
    const ICON_CLASSES = "w-4 h-4 mr-3 text-[var(--text-primary)] group-hover:text-[var(--accent-lime)] transition-colors";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer focus:outline-none">
                    <ProfileAvatar
                        avatar={userData.avatar}
                        name={userData.name}
                        initials={initials}
                        size="sm"
                    />
                    <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-72 bg-[var(--surface-1)] border border-[var(--border-gray)] rounded-xl p-0 overflow-hidden"
            >
                {/* User Info Header */}
                <div className="px-4 py-4 border-b border-[var(--border-gray)]">
                    <div className="flex items-center gap-3">
                        <ProfileAvatar
                            avatar={userData.avatar}
                            name={userData.name}
                            initials={initials}
                            size="md"
                        />
                        <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                            <div className="text-[var(--text-primary)] text-base font-semibold truncate">
                                {userData.name}
                            </div>
                            <div className="text-[var(--text-tertiary)] text-sm truncate">
                                {userData.email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upgrade to Pro Card */}
                <div className="px-3 py-3 border-b border-border">
                    <div className="p-3 rounded-lg bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface-1)] border border-[var(--border-gray)]">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-lime)]/10 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-[var(--accent-lime)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[var(--text-primary)] text-sm font-semibold">
                                        Upgrade to Pro
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="bg-[var(--accent-lime)]/10 text-[var(--accent-lime)] border-0 text-[10px] rounded-sm font-bold px-2 py-1"
                                    >
                                        PRO
                                    </Badge>
                                </div>
                                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                                    Unlimited sessions & advanced AI tools
                                </p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                    <DropdownMenuItem className={MENU_ITEM_CLASSES}>
                        <Users className={ICON_CLASSES} />
                        <span className="text-sm font-medium">
                            {DASHBOARD_COPY.dropdown.managePlans}
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={onSettingsClick}
                        className={MENU_ITEM_CLASSES}
                    >
                        <Settings className={ICON_CLASSES} />
                        <span className="text-sm font-medium">
                            {DASHBOARD_COPY.dropdown.settings}
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push('/help')}
                        className={MENU_ITEM_CLASSES}
                    >
                        <HelpCircle className={ICON_CLASSES} />
                        <span className="text-sm font-medium">
                            Help & Support
                        </span>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-[var(--border-gray)] m-0" />

                {/* Logout */}
                <div className="p-2">
                    <DropdownMenuItem
                        onClick={onSignOut}
                        className={MENU_ITEM_CLASSES}
                    >
                        <LogOut className={ICON_CLASSES} />
                        <span className="text-sm font-medium">
                            {DASHBOARD_COPY.dropdown.logout}
                        </span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
