import { ReactNode } from 'react';

export interface ShowcaseCard {
    id: number;
    image: string;
    alt: string;
}

export interface Feature {
    icon: ReactNode;
    title: string;
    description: string;
}
