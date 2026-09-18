import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const FAVOURITES_KEY = 'pyttogpanne.favourites.v1';
const SHOPPING_KEY = 'pyttogpanne.shopping.v1';

export interface ShoppingItem {
    /** Stable within a list, so an item added twice from different recipes stays separate. */
    id: string;
    text: string;
    /** The recipe it came from, shown as a subtitle while packing. */
    fromRecipe: string | null;
    checked: boolean;
}

interface Lists {
    favourites: string[];
    shopping: ShoppingItem[];
    isFavourite: (slug: string) => boolean;
    toggleFavourite: (slug: string) => void;
    addToShopping: (lines: string[], fromRecipe: string) => void;
    toggleShoppingItem: (id: string) => void;
    removeShoppingItem: (id: string) => void;
    clearChecked: () => void;
    clearShopping: () => void;
}

const ListsContext = createContext<Lists | null>(null);

async function read<T>(key: string, fallback: T): Promise<T> {
    try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

async function write(key: string, value: unknown): Promise<void> {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Nothing here is worth failing the interaction over.
    }
}

export function ListsProvider({ children }: { children: React.ReactNode }) {
    const [favourites, setFavourites] = useState<string[]>([]);
    const [shopping, setShopping] = useState<ShoppingItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        Promise.all([
            read<string[]>(FAVOURITES_KEY, []),
            read<ShoppingItem[]>(SHOPPING_KEY, []),
        ]).then(([storedFavourites, storedShopping]) => {
            setFavourites(storedFavourites);
            setShopping(storedShopping);
            setLoaded(true);
        });
    }, []);

    // Skipped until the stored lists are in, so an empty initial state never overwrites them.
    useEffect(() => { if (loaded) write(FAVOURITES_KEY, favourites); }, [loaded, favourites]);
    useEffect(() => { if (loaded) write(SHOPPING_KEY, shopping); }, [loaded, shopping]);

    const toggleFavourite = useCallback((slug: string) => {
        setFavourites(current => (current.includes(slug) ? current.filter(s => s !== slug) : [...current, slug]));
    }, []);

    const addToShopping = useCallback((lines: string[], fromRecipe: string) => {
        setShopping(current => [
            ...current,
            ...lines.map((text, index) => ({
                id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
                text,
                fromRecipe,
                checked: false,
            })),
        ]);
    }, []);

    const toggleShoppingItem = useCallback((id: string) => {
        setShopping(current => current.map(item => (item.id === id ? { ...item, checked: !item.checked } : item)));
    }, []);

    const removeShoppingItem = useCallback((id: string) => {
        setShopping(current => current.filter(item => item.id !== id));
    }, []);

    const clearChecked = useCallback(() => setShopping(current => current.filter(item => !item.checked)), []);
    const clearShopping = useCallback(() => setShopping([]), []);

    const value = useMemo<Lists>(() => ({
        favourites,
        shopping,
        isFavourite: (slug: string) => favourites.includes(slug),
        toggleFavourite,
        addToShopping,
        toggleShoppingItem,
        removeShoppingItem,
        clearChecked,
        clearShopping,
    }), [favourites, shopping, toggleFavourite, addToShopping, toggleShoppingItem, removeShoppingItem, clearChecked, clearShopping]);

    return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists(): Lists {
    const value = useContext(ListsContext);
    if (!value) throw new Error('useLists must be used inside ListsProvider');
    return value;
}
