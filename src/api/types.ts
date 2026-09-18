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
    publishedAt: string | null;
    updatedAt: string;
    categories: RecipeCategory[];
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
}

export interface RecipeSync {
    serverTime: string;
    recipes: Recipe[];
    deletedSlugs: string[];
}

export type GearKind = 'Utstyr' | 'Tips';

export interface GearItem {
    id: number;
    slug: string;
    title: string;
    kind: GearKind;
    summary: string | null;
    body: string;
    contentImageId: string | null;
    sortOrder: number;
    isPublished: boolean;
    updatedAt: string;
}
