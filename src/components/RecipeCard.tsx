import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { imageUrl } from '../api/client';
import type { Recipe } from '../api/types';
import { summaryLine } from '../recipes/format';
import AdvertisingLabel from './AdvertisingLabel';
import { colors, radius, shadow, space, type } from '../theme/theme';

interface Props {
    recipe: Recipe;
    onPress: () => void;
    isFavourite: boolean;
    onToggleFavourite: () => void;
}

function RecipeCard({ recipe, onPress, isFavourite, onToggleFavourite }: Props) {
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
                {recipe.isAdvertising && <AdvertisingLabel advertiser={recipe.advertiser} compact />}
                <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
                <Text style={styles.meta}>{summaryLine(recipe)}</Text>
                {recipe.intro ? <Text style={styles.intro} numberOfLines={2}>{recipe.intro}</Text> : null}
            </View>
        </Pressable>
    );
}

export default memo(RecipeCard);

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        overflow: 'hidden',
        marginBottom: space.lg,
        ...shadow.card,
    },
    pressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
    imageBox: { position: 'relative' },
    image: { width: '100%', aspectRatio: 3 / 2, backgroundColor: colors.paperSunk },
    imageEmpty: { alignItems: 'center', justifyContent: 'center' },
    favourite: {
        position: 'absolute',
        top: space.md,
        right: space.md,
        backgroundColor: 'rgba(42, 32, 23, 0.4)',
        borderRadius: radius.pill,
        padding: space.sm,
    },
    body: { padding: space.lg, gap: space.xs },
    title: { ...type.title, color: colors.ink },
    meta: { ...type.meta, color: colors.moss },
    intro: { ...type.body, color: colors.inkSoft, marginTop: space.xs },
});
