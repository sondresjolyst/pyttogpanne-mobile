import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCategories, fetchGear, fetchRecipeSync } from '../api/client';
import type { GearItem, Recipe, RecipeCategory } from '../api/types';
import { merge } from './merge';

const CACHE_KEY = 'pyttogpanne.catalog.v1';

interface Cache {
    /** The API's clock at the last successful sync, sent back as `since`. */
    serverTime: string | null;
    recipes: Recipe[];
    categories: RecipeCategory[];
    gear: GearItem[];
}

const EMPTY: Cache = { serverTime: null, recipes: [], categories: [], gear: [] };

export type SyncState = 'loading' | 'ready' | 'syncing' | 'offline';

interface Catalog extends Cache {
    state: SyncState;
    /** Set when the last sync attempt failed, so the UI can say the list may be stale. */
    lastError: string | null;
    refresh: () => Promise<void>;
}

const CatalogContext = createContext<Catalog | null>(null);

async function readCache(): Promise<Cache> {
    try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw) return EMPTY;
        const parsed = JSON.parse(raw) as Partial<Cache>;
        return {
            serverTime: parsed.serverTime ?? null,
            recipes: parsed.recipes ?? [],
            categories: parsed.categories ?? [],
            gear: parsed.gear ?? [],
        };
    } catch {
        // A cache we cannot read is worth no more than an empty one.
        return EMPTY;
    }
}

async function writeCache(cache: Cache): Promise<void> {
    try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Out of space or otherwise unwritable: the app still works for this session.
    }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
    const [cache, setCache] = useState<Cache>(EMPTY);
    const [state, setState] = useState<SyncState>('loading');
    const [lastError, setLastError] = useState<string | null>(null);
    const syncing = useRef(false);

    const sync = useCallback(async (current: Cache) => {
        if (syncing.current) return;
        syncing.current = true;
        setState(current.recipes.length > 0 ? 'syncing' : 'loading');

        try {
            const [delta, categories, gear] = await Promise.all([
                fetchRecipeSync(current.serverTime ?? undefined),
                fetchCategories(),
                fetchGear(),
            ]);

            const next: Cache = {
                serverTime: delta.serverTime,
                recipes: merge(current.recipes, delta.recipes, delta.deletedSlugs),
                categories,
                gear,
            };
            setCache(next);
            setLastError(null);
            setState('ready');
            await writeCache(next);
        } catch (error) {
            setLastError(error instanceof Error ? error.message : 'Ukjent feil');
            // Cached recipes are the whole point offline: keep showing them.
            setState(current.recipes.length > 0 ? 'ready' : 'offline');
        } finally {
            syncing.current = false;
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        readCache().then(stored => {
            if (cancelled) return;
            setCache(stored);
            if (stored.recipes.length > 0) setState('ready');
            sync(stored);
        });
        return () => { cancelled = true; };
    }, [sync]);

    const refresh = useCallback(async () => { await sync(cache); }, [sync, cache]);

    const value = useMemo<Catalog>(() => ({ ...cache, state, lastError, refresh }), [cache, state, lastError, refresh]);

    return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
    const value = useContext(CatalogContext);
    if (!value) throw new Error('useCatalog must be used inside CatalogProvider');
    return value;
}

export function useRecipe(slug: string): Recipe | undefined {
    const { recipes } = useCatalog();
    return recipes.find(recipe => recipe.slug === slug);
}
