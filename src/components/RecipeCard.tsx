import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { imageUrl } from '../api/client';
import type { Recipe } from '../api/types';
import { summaryLine } from '../recipes/format';
import { colors, radius, space, type } from '../theme/theme';

interface Props {
    recipe: Recipe;
    onPress: () => void;
    isFavourite: boolean;
    onToggleFavourite: () => void;
}

export default function RecipeCard({ recipe, onPress, isFavourite, onToggleFavourite }: Props) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={recipe.title}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <View style={styles.imageBox}>
                {recipe.coverImageId ? (
                    <Image
                        source={{ uri: imageUrl(recipe.coverImageId, 800) }}
                        style={styles.image}
                        contentFit="cover"
                        transition={120}
                    />
                ) : (
                    <View style={[styles.image, styles.imageEmpty]}>
                        <Ionicons name="flame-outline" size={32} color={colors.inkSoft} />
                    </View>
                )}

                <Pressable
                    onPress={onToggleFavourite}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={isFavourite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
                    style={styles.favourite}
                >
                    <Ionicons
                        name={isFavourite ? 'heart' : 'heart-outline'}
                        size={22}
                        color={isFavourite ? colors.ember : colors.paper}
                    />
                </Pressable>
            </View>

            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
                <Text style={styles.meta}>{summaryLine(recipe)}</Text>
                {recipe.intro ? <Text style={styles.intro} numberOfLines={2}>{recipe.intro}</Text> : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.line,
        marginBottom: space.lg,
    },
    pressed: { opacity: 0.85 },
    imageBox: { position: 'relative' },
    image: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.paperSunk },
    imageEmpty: { alignItems: 'center', justifyContent: 'center' },
    favourite: {
        position: 'absolute',
        top: space.sm,
        right: space.sm,
        backgroundColor: 'rgba(36, 28, 20, 0.45)',
        borderRadius: radius.lg,
        padding: space.sm,
    },
    body: { padding: space.lg, gap: space.xs },
    title: { ...type.title, color: colors.ink },
    meta: { ...type.meta, color: colors.moss },
    intro: { ...type.body, color: colors.inkSoft, marginTop: space.xs },
});
