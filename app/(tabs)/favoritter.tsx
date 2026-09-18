import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RecipeCard from '../../src/components/RecipeCard';
import { useCatalog } from '../../src/store/catalog';
import { useLists } from '../../src/store/lists';
import { colors, space, type } from '../../src/theme/theme';

export default function FavouritesScreen() {
    const router = useRouter();
    const { recipes } = useCatalog();
    const { favourites, isFavourite, toggleFavourite } = useLists();

    const saved = recipes.filter(recipe => favourites.includes(recipe.slug));

    return (
        <FlatList
            data={saved}
            keyExtractor={recipe => recipe.slug}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Ionicons name="heart-outline" size={36} color={colors.inkSoft} />
                    <Text style={styles.emptyTitle}>Ingen favoritter ennå</Text>
                    <Text style={styles.emptyText}>
                        Trykk på hjertet på en oppskrift, så ligger den her neste gang du planlegger tur.
                    </Text>
                </View>
            }
            renderItem={({ item }) => (
                <RecipeCard
                    recipe={item}
                    onPress={() => router.push(`/oppskrift/${item.slug}`)}
                    isFavourite={isFavourite(item.slug)}
                    onToggleFavourite={() => toggleFavourite(item.slug)}
                />
            )}
        />
    );
}

const styles = StyleSheet.create({
    list: { padding: space.lg, paddingBottom: space.xxl, flexGrow: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
    emptyTitle: { ...type.heading, color: colors.ink },
    emptyText: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
});
