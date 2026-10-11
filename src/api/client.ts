import axios from 'axios';
import Constants from 'expo-constants';
import { LEGAL_KEYS, type GearItem, type LegalPage, type RecipeCategory, type RecipeSync } from './types';

// EXPO_PUBLIC_API_URL is set per build profile in eas.json, and in .env.local for a local API.
const baseURL = process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';

export const api = axios.create({ baseURL, timeout: 15000 });

/** Where the app loads an uploaded image from, at the width it displays it. */
export const imageUrl = (id: string, width: number): string =>
    `${baseURL}/content-images/${id}?w=${Math.round(width)}`;

/** The API only serves its resized WebP variants when asked for WebP. Otherwise it sends the full original. */
export const IMAGE_HEADERS = { Accept: 'image/webp' };

/** Widths shared by the screens and the prefetch, so a prefetched photo is the one a screen asks for. */
export const COVER_WIDTH = 800;
export const PHOTO_WIDTH = 1200;
export const THUMB_WIDTH = 240;

export const imageSource = (id: string, width: number) => ({ uri: imageUrl(id, width), headers: IMAGE_HEADERS });

export const fetchRecipeSync = async (since?: string): Promise<RecipeSync> => {
    const { data } = await api.get<RecipeSync>('/recipes/sync', { params: since ? { since } : undefined });
    return data;
};

export const fetchCategories = async (): Promise<RecipeCategory[]> => {
    const { data } = await api.get<RecipeCategory[]>('/recipe-categories');
    return data;
};

export const fetchGear = async (): Promise<GearItem[]> => {
    const { data } = await api.get<GearItem[]>('/gear');
    return data;
};

/**
 * The legal pages, cached with everything else so they are readable without signal. A page the
 * API has not been given yet simply comes back missing rather than failing the whole sync.
 */
export const fetchLegalPages = async (): Promise<LegalPage[]> => {
    const pages = await Promise.all(
        LEGAL_KEYS.map(key =>
            api.get<LegalPage>(`/content/legal/${key}`, { params: { locale: 'no' } })
                .then(response => response.data)
                .catch(() => null)),
    );
    return pages.filter((page): page is LegalPage => page != null);
};
