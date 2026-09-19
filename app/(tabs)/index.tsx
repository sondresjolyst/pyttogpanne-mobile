import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RecipeCard from '../../src/components/RecipeCard';
import { useCatalog } from '../../src/store/catalog';
import { useLists } from '../../src/store/lists';
import EmptyState from '../../src/components/EmptyState';
import { colors, radius, shadow, space, type, TAB_BAR_CLEARANCE } from '../../src/theme/theme';

const ALL_CATEGORIES = { id: 0, key: '', name: 'Alle', sortOrder: -1 };

export default function RecipesScreen() {
    const router = useRouter();
    const { recipes, categories, state, lastError, refresh } = useCatalog();
    const { isFavourite, toggleFavourite } = useLists();
    const [search, setSearch] = useState('');
    const [categoryKey, setCategoryKey] = useState<string | null>(null);

    const chips = useMemo(() => [ALL_CATEGORIES, ...categories], [categories]);

    const openRecipe = useCallback((slug: string) => router.push(`/oppskrift/${slug}`), [router]);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return recipes.filter(recipe => {
            if (categoryKey && !recipe.categories.some(category => category.key === categoryKey)) return false;
            if (!term) return true;
            return (
                recipe.title.toLowerCase().includes(term) ||
                (recipe.intro ?? '').toLowerCase().includes(term) ||
                recipe.ingredients.some(ingredient => ingredient.name.toLowerCase().includes(term))
            );
        });
    }, [recipes, search, categoryKey]);

    return (
        <FlatList
            data={visible}
            keyExtractor={recipe => recipe.slug}
            contentContainerStyle={styles.list}
            refreshControl={
                <RefreshControl refreshing={state === 'syncing'} onRefresh={refresh} tintColor={colors.brown} />
            }
            ListHeaderComponent={
                <View style={styles.header}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={18} color={colors.inkSoft} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Søk i oppskrifter eller ingredienser"
                            placeholderTextColor={colors.inkSoft}
                            style={styles.searchInput}
                            returnKeyType="search"
                            clearButtonMode="while-editing"
                        />
                    </View>

                    {categories.length > 0 && (
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={chips}
                            keyExtractor={category => category.key || 'alle'}
                            contentContainerStyle={styles.chips}
                            renderItem={({ item }) => {
                                const key = item.key || null;
                                const active = categoryKey === key;
                                return (
                                    <Pressable
                                        onPress={() => setCategoryKey(key)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: active }}
                                        style={[styles.chip, active && styles.chipActive]}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
                                    </Pressable>
                                );
                            }}
                        />
                    )}

                    {lastError && recipes.length > 0 && (
                        <Text style={styles.stale}>Viser lagrede oppskrifter. Du er ikke koblet til nett.</Text>
                    )}
                </View>
            }
            ListEmptyComponent={
                state === 'loading' ? (
                    <EmptyState text="Henter oppskrifter…" />
                ) : state === 'offline' ? (
                    <EmptyState
                        icon="cloud-offline-outline"
                        title="Ingen oppskrifter lagret"
                        text="Koble til nett én gang, så er oppskriftene med deg på tur uten dekning."
                    />
                ) : (
                    <EmptyState
                        icon="search-outline"
                        title="Ingen treff"
                        text="Prøv et annet søkeord eller en annen kategori."
                    />
                )
            }
            renderItem={({ item }) => (
                <RecipeCard
                    recipe={item}
                    onPress={() => openRecipe(item.slug)}
                    isFavourite={isFavourite(item.slug)}
                    onToggleFavourite={() => toggleFavourite(item.slug)}
                />
            )}
        />
    );
}

const styles = StyleSheet.create({
    list: { padding: space.lg, paddingBottom: TAB_BAR_CLEARANCE },
    header: { gap: space.md, marginBottom: space.lg },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        backgroundColor: colors.white,
        borderRadius: radius.pill,
        paddingHorizontal: space.lg,
        height: 48,
        ...shadow.card,
    },
    searchInput: { flex: 1, ...type.body, color: colors.ink },
    chips: { gap: space.sm, paddingVertical: space.xs },
    chip: {
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
        borderRadius: radius.pill,
        backgroundColor: colors.paperSunk,
    },
    chipActive: { backgroundColor: colors.brown, borderColor: colors.brown },
    chipText: { ...type.meta, color: colors.inkSoft },
    chipTextActive: { color: colors.paper },
    stale: { ...type.meta, color: colors.ember },
});
