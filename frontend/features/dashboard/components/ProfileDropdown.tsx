"use client";

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
import Image from "next/image";

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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-1)] transition-colors cursor-pointer focus:outline-none">
                    {userData.avatar ? (
                        <Image
                            src={userData.avatar}
                            alt={userData.name || "User"}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-[var(--voltage-orange)] rounded-full inline-flex flex-col justify-center items-center">
                            <div className="text-white text-sm font-semibold">
                                {initials}
                            </div>
                        </div>
                    )}
                    <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-72 bg-[var(--surface-1)] border border-[var(--border-gray)] rounded-xl p-0 overflow-hidden"
            >
                {/* User Info Header */}
                <div className="px-4 py-4 border-b border-[var(--border-gray)]">
                    <div className="flex items-center gap-3">
                        {userData.avatar ? (
                            <Image
                                src={userData.avatar}
                                alt={userData.name || "User"}
                                width={44}
                                height={44}
                                className="w-11 h-11 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-11 h-11 bg-[var(--voltage-orange)] rounded-full inline-flex flex-col justify-center items-center">
                                <div className="text-white text-base font-semibold">
                                    {initials}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                            <div className="text-[var(--text-primary)] text-base font-semibold truncate">
                                {userData.name}
                            </div>
                            <div className="text-[var(--text-secondary)] text-sm truncate">
                                {userData.email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upgrade to Pro Card */}
                <div className="px-3 py-3 border-b border-[var(--border-gray)]">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-[var(--surface-2)] to-[var(--surface-1)] border border-[var(--border-gray)]">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-md bg-accent-lime/10 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-[var(--accent-lime)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[var(--text-primary)] text-sm font-semibold">
                                        Upgrade to Pro
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="bg-[var(--accent-lime)]/10 text-[var(--accent-lime)] border-0 text-[10px] font-bold rounded-sm px-2 py-1"
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
                    <DropdownMenuItem className="group px-4 py-2.5 text-text-primary hover:bg-surface-2 cursor-pointer focus:bg-surface-2 rounded-md">
                        <Users className="w-4 h-4 mr-3 text-text-primary group-hover:text-accent-lime transition-colors" />
                        <span className="text-sm font-medium">
                            {DASHBOARD_COPY.dropdown.managePlans}
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={onSettingsClick}
                        className="group px-4 py-2.5 text-text-primary hover:bg-surface-2 cursor-pointer focus:bg-surface-2 rounded-md"
                    >
                        <Settings className="w-4 h-4 mr-3 text-text-primary group-hover:text-accent-lime transition-colors" />
                        <span className="text-sm font-medium">
                            {DASHBOARD_COPY.dropdown.settings}
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push('/help')}
                        className="group px-4 py-2.5 text-text-primary hover:bg-surface-2 cursor-pointer focus:bg-surface-2 rounded-md"
                    >
                        <HelpCircle className="w-4 h-4 mr-3 text-text-primary group-hover:text-accent-lime transition-colors" />
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
                        className="group px-4 py-2.5 text-text-primary hover:bg-surface-2 cursor-pointer focus:bg-surface-2 rounded-md"
                    >
                        <LogOut className="w-4 h-4 mr-3 text-text-primary group-hover:text-accent-lime transition-colors" />
                        <span className="text-sm font-medium">
                            {DASHBOARD_COPY.dropdown.logout}
                        </span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
