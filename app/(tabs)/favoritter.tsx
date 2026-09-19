import { FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RecipeCard from '../../src/components/RecipeCard';
import { useCatalog } from '../../src/store/catalog';
import { useLists } from '../../src/store/lists';
import EmptyState from '../../src/components/EmptyState';
import { space, TAB_BAR_CLEARANCE } from '../../src/theme/theme';

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
                <EmptyState
                    icon="heart-outline"
                    title="Ingen favoritter ennå"
                    text="Trykk på hjertet på en oppskrift, så ligger den her neste gang du planlegger tur."
                />
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
    list: { padding: space.lg, paddingBottom: TAB_BAR_CLEARANCE, flexGrow: 1 },
});
