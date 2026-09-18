import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { imageUrl } from '../../src/api/client';
import { detailLine, groupIngredients, ingredientLine, servingsFactor } from '../../src/recipes/format';
import { useRecipe } from '../../src/store/catalog';
import { useLists } from '../../src/store/lists';
import { colors, radius, space, type } from '../../src/theme/theme';

export default function RecipeScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();
    const recipe = useRecipe(slug);
    const { isFavourite, toggleFavourite, addToShopping } = useLists();

    const [servings, setServings] = useState(recipe?.servings ?? 2);
    const [doneSteps, setDoneSteps] = useState<number[]>([]);
    const [added, setAdded] = useState(false);

    const factor = recipe ? servingsFactor(recipe, servings) : 1;
    const groups = useMemo(() => groupIngredients(recipe?.ingredients ?? []), [recipe]);

    if (!recipe) {
        return (
            <View style={styles.missing}>
                <Ionicons name="help-circle-outline" size={36} color={colors.inkSoft} />
                <Text style={styles.missingTitle}>Fant ikke oppskriften</Text>
                <Text style={styles.missingText}>Den kan være fjernet. Dra ned på oppskriftslisten for å oppdatere.</Text>
                <Pressable onPress={() => router.back()} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Tilbake</Text>
                </Pressable>
            </View>
        );
    }

    const favourite = isFavourite(recipe.slug);

    const addAll = () => {
        addToShopping(recipe.ingredients.map(ingredient => ingredientLine(ingredient, factor)), recipe.title);
        setAdded(true);
    };

    return (
        <ScrollView contentContainerStyle={styles.page} style={styles.scroll}>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <Pressable
                            onPress={() => toggleFavourite(recipe.slug)}
                            hitSlop={12}
                            accessibilityRole="button"
                            accessibilityLabel={favourite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
                        >
                            <Ionicons name={favourite ? 'heart' : 'heart-outline'} size={24} color={favourite ? colors.ember : colors.paper} />
                        </Pressable>
                    ),
                }}
            />

            {recipe.coverImageId ? (
                <Image source={{ uri: imageUrl(recipe.coverImageId, 1200) }} style={styles.hero} contentFit="cover" transition={150} />
            ) : (
                <View style={[styles.hero, styles.heroEmpty]} />
            )}

            <View style={styles.body}>
                <Text style={styles.title}>{recipe.title}</Text>
                <Text style={styles.meta}>{detailLine(recipe)}</Text>
                {recipe.intro ? <Text style={styles.intro}>{recipe.intro}</Text> : null}

                <View style={styles.servings}>
                    <Text style={styles.servingsLabel}>Porsjoner</Text>
                    <View style={styles.stepper}>
                        <Pressable
                            onPress={() => setServings(current => Math.max(1, current - 1))}
                            accessibilityRole="button"
                            accessibilityLabel="Færre porsjoner"
                            style={styles.stepperButton}
                        >
                            <Ionicons name="remove" size={22} color={colors.ink} />
                        </Pressable>
                        <Text style={styles.stepperValue}>{servings}</Text>
                        <Pressable
                            onPress={() => setServings(current => Math.min(50, current + 1))}
                            accessibilityRole="button"
                            accessibilityLabel="Flere porsjoner"
                            style={styles.stepperButton}
                        >
                            <Ionicons name="add" size={22} color={colors.ink} />
                        </Pressable>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Ingredienser</Text>
                {groups.map((group, groupIndex) => (
                    <View key={group.heading ?? `gruppe-${groupIndex}`} style={styles.group}>
                        {group.heading ? <Text style={styles.groupHeading}>{group.heading}</Text> : null}
                        {group.rows.map(ingredient => (
                            <View key={ingredient.id} style={styles.ingredientRow}>
                                <Text style={styles.ingredient}>{ingredientLine(ingredient, factor)}</Text>
                                {ingredient.note ? <Text style={styles.note}>{ingredient.note}</Text> : null}
                            </View>
                        ))}
                    </View>
                ))}

                <Pressable onPress={addAll} style={styles.primaryButton} accessibilityRole="button">
                    <Ionicons name={added ? 'checkmark' : 'bag-handle-outline'} size={18} color={colors.paper} />
                    <Text style={styles.primaryButtonText}>
                        {added ? 'Lagt i handlelisten' : 'Legg ingrediensene i handlelisten'}
                    </Text>
                </Pressable>

                <Text style={styles.sectionTitle}>Fremgangsmåte</Text>
                <Text style={styles.sectionHint}>Trykk på et steg når det er gjort, så finner du plassen igjen.</Text>
                {recipe.steps.map((step, index) => {
                    const done = doneSteps.includes(step.id);
                    return (
                        <Pressable
                            key={step.id}
                            onPress={() =>
                                setDoneSteps(current => (done ? current.filter(id => id !== step.id) : [...current, step.id]))
                            }
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: done }}
                            style={[styles.step, done && styles.stepDone]}
                        >
                            <Text style={[styles.stepNumber, done && styles.stepNumberDone]}>{index + 1}</Text>
                            <Text style={[styles.stepText, done && styles.stepTextDone]}>{step.text}</Text>
                        </Pressable>
                    );
                })}

                {recipe.tips ? (
                    <View style={styles.tips}>
                        <Text style={styles.tipsHeading}>Tips</Text>
                        <Text style={styles.tipsText}>{recipe.tips}</Text>
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { backgroundColor: colors.paper },
    page: { paddingBottom: space.xxl },
    hero: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.paperSunk },
    heroEmpty: { aspectRatio: 16 / 9 },
    body: { padding: space.lg, gap: space.md },
    title: { ...type.display, color: colors.ink },
    meta: { ...type.meta, color: colors.moss },
    intro: { ...type.body, color: colors.inkSoft },
    servings: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        marginTop: space.sm,
    },
    servingsLabel: { ...type.bodyStrong, color: colors.ink },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    stepperButton: {
        width: 40,
        height: 40,
        borderRadius: radius.lg,
        backgroundColor: colors.paperSunk,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: { ...type.title, color: colors.ink, minWidth: 28, textAlign: 'center' },
    sectionTitle: { ...type.title, color: colors.ink, marginTop: space.lg },
    sectionHint: { ...type.meta, color: colors.inkSoft, marginTop: -space.sm },
    group: { gap: space.xs },
    groupHeading: { ...type.bodyStrong, color: colors.moss, marginTop: space.sm },
    ingredientRow: { paddingVertical: space.xs, borderBottomWidth: 1, borderBottomColor: colors.line },
    ingredient: { ...type.body, color: colors.ink },
    note: { ...type.meta, color: colors.inkSoft },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        backgroundColor: colors.brown,
        borderRadius: radius.md,
        paddingVertical: space.lg,
        marginTop: space.md,
    },
    primaryButtonText: { ...type.bodyStrong, color: colors.paper },
    step: {
        flexDirection: 'row',
        gap: space.lg,
        alignItems: 'flex-start',
        backgroundColor: colors.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        padding: space.lg,
    },
    stepDone: { backgroundColor: colors.paperSunk, borderColor: colors.paperSunk },
    stepNumber: { fontSize: 30, lineHeight: 32, fontWeight: '800', color: colors.ember, minWidth: 34 },
    stepNumberDone: { color: colors.inkSoft },
    stepText: { ...type.body, color: colors.ink, flex: 1 },
    stepTextDone: { color: colors.inkSoft, textDecorationLine: 'line-through' },
    tips: {
        backgroundColor: colors.paperSunk,
        borderRadius: radius.md,
        padding: space.lg,
        marginTop: space.lg,
        gap: space.xs,
    },
    tipsHeading: { ...type.heading, color: colors.brown },
    tipsText: { ...type.body, color: colors.ink },
    missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
    missingTitle: { ...type.title, color: colors.ink },
    missingText: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
});
