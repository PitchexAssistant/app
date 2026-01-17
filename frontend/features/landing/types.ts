import { LucideIcon } from 'lucide-react';

export interface ShowcaseCard {
    id: number;
    image: string;
    alt: string;
}

export interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}
