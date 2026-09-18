import axios from 'axios';
import Constants from 'expo-constants';
import type { GearItem, RecipeCategory, RecipeSync } from './types';

const baseURL = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';

export const api = axios.create({ baseURL, timeout: 15000 });

/** Where the app loads an uploaded image from, at the width it displays it. */
export const imageUrl = (id: string, width: number): string =>
    `${baseURL}/content-images/${id}?w=${Math.round(width)}`;

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
