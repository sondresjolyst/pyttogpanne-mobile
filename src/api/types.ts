export type Difficulty = 'Enkel' | 'Middels' | 'Avansert';

export interface RecipeCategory {
    id: number;
    key: string;
    name: string;
    sortOrder: number;
}

export interface RecipeIngredient {
    id: number;
    sortOrder: number;
    groupName: string | null;
    amount: string | null;
    unit: string | null;
    name: string;
    note: string | null;
}

export interface RecipeStep {
    id: number;
    sortOrder: number;
    text: string;
    contentImageId: string | null;
}

export interface GalleryImage {
    id: number;
    contentImageId: string;
    sortOrder: number;
    caption: string | null;
}

export interface Recipe {
    id: number;
    slug: string;
    title: string;
    intro: string | null;
    servings: number;
    totalMinutes: number | null;
    prepMinutes: number | null;
    cookMinutes: number | null;
    difficulty: Difficulty;
    tips: string | null;
    coverImageId: string | null;
    isPublished: boolean;
    isAdvertising: boolean;
    advertiser: string | null;
    publishedAt: string | null;
    updatedAt: string;
    categories: RecipeCategory[];
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
    images: GalleryImage[];
}

export interface RecipeSync {
    serverTime: string;
    recipes: Recipe[];
    deletedSlugs: string[];
}

export const LEGAL_KEYS = ['terms', 'privacy', 'cookies'] as const;

export type LegalKey = (typeof LEGAL_KEYS)[number];

export interface LegalPage {
    key: LegalKey;
    locale: string;
    title: string;
    bodyMarkdown: string;
    updatedAt: string;
}

export type GearKind = 'Utstyr' | 'Tips';

export interface GearItem {
    id: number;
    slug: string;
    title: string;
    kind: GearKind;
    summary: string | null;
    body: string;
    coverImageId: string | null;
    images: GalleryImage[];
    sortOrder: number;
    isPublished: boolean;
    isAdvertising: boolean;
    advertiser: string | null;
    updatedAt: string;
}
