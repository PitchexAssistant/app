"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
    { label: "Product", href: "#product" },
    { label: "Enterprise", href: "#enterprise" },
    { label: "Customers", href: "#customers" },
    { label: "Pricing", href: "#pricing" },
];

export const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 w-full" style={{ background: 'linear-gradient(to bottom, var(--surface-0) 0%, transparent 100%)' }}>
            <div className="mx-auto flex h-18 max-w-8xl items-center justify-between px-4 lg:px-8">
                {/* Left Section - Logo Button and Nav Items */}
                <div className="flex items-center gap-2">
                    {/* Logo Button */}
                    <Button variant="nav" asChild>
                        <Link href="/">
                            <Image
                                src="/logo-sidebar-collapsed.svg"
                                alt="Pitchex"
                                width={24}
                                height={15}
                                className="h-4 w-auto"
                            />
                        </Link>
                    </Button>

                    {/* Desktop Navigation Items */}
                    <div className="hidden items-center gap-1 md:flex">
                        {navItems.map((item) => (
                            <Button key={item.label} variant="nav" asChild>
                                <Link href={item.href}>
                                    {item.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Right Section - Login, CTA, and Mobile Menu Button */}
                <div className="flex items-center gap-2">
                    {/* Desktop Login and CTA */}
                    <div className="hidden items-center gap-2 md:flex">
                        <Button variant="nav" asChild>
                            <Link href="/login">
                                Log in
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/contact">
                                Get started
                            </Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMobileMenu}
                        className="md:hidden"
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-14 z-40 bg-surface-0/95 backdrop-blur-sm md:hidden">
                    <div className="flex flex-col gap-2 p-4">
                        {/* Mobile Navigation Items */}
                        {navItems.map((item) => (
                            <Button key={item.label} variant="nav" className="w-full justify-start" asChild>
                                <Link href={item.href} onClick={closeMobileMenu}>
                                    {item.label}
                                </Link>
                            </Button>
                        ))}

                        {/* Divider */}
                        <div className="my-2 h-px bg-surface-3" />

                        {/* Mobile Login and CTA */}
                        <Button variant="nav" className="w-full" asChild>
                            <Link href="/login" onClick={closeMobileMenu}>
                                Log in
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/contact" onClick={closeMobileMenu}>
                                Contact sales
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
};
