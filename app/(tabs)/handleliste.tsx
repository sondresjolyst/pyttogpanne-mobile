import { useMemo } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLists, type ShoppingItem } from '../../src/store/lists';
import EmptyState from '../../src/components/EmptyState';
import { colors, radius, shadow, space, type, TAB_BAR_CLEARANCE } from '../../src/theme/theme';

export default function ShoppingScreen() {
    const { shopping, toggleShoppingItem, removeShoppingItem, clearChecked, clearShopping } = useLists();

    const sections = useMemo(() => {
        const byRecipe = new Map<string, ShoppingItem[]>();
        for (const item of shopping) {
            const key = item.fromRecipe ?? 'Lagt til selv';
            byRecipe.set(key, [...(byRecipe.get(key) ?? []), item]);
        }
        return [...byRecipe.entries()].map(([title, data]) => ({ title, data }));
    }, [shopping]);

    const checkedCount = shopping.filter(item => item.checked).length;

    const confirmClear = () => {
        Alert.alert('Tømme handlelisten?', 'Alt på listen blir fjernet.', [
            { text: 'Avbryt', style: 'cancel' },
            { text: 'Tøm listen', style: 'destructive', onPress: clearShopping },
        ]);
    };

    return (
        <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
                <EmptyState
                    icon="bag-handle-outline"
                    title="Handlelisten er tom"
                    text="Åpne en oppskrift og legg ingrediensene hit, så har du dem samlet i butikken."
                />
            }
            ListFooterComponent={
                shopping.length > 0 ? (
                    <View style={styles.footer}>
                        {checkedCount > 0 && (
                            <Pressable onPress={clearChecked} style={styles.secondaryButton} accessibilityRole="button">
                                <Text style={styles.secondaryButtonText}>Fjern {checkedCount} avhuket</Text>
                            </Pressable>
                        )}
                        <Pressable onPress={confirmClear} style={styles.secondaryButton} accessibilityRole="button">
                            <Text style={styles.secondaryButtonText}>Tøm listen</Text>
                        </Pressable>
                    </View>
                ) : null
            }
            renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
            renderItem={({ item }) => (
                <View style={styles.row}>
                    <Pressable
                        onPress={() => toggleShoppingItem(item.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: item.checked }}
                        accessibilityLabel={item.text}
                        style={styles.rowMain}
                        hitSlop={8}
                    >
                        <View style={[styles.box, item.checked && styles.boxChecked]}>
                            {item.checked && <Ionicons name="checkmark" size={18} color={colors.paper} />}
                        </View>
                        <Text style={[styles.rowText, item.checked && styles.rowTextChecked]}>{item.text}</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => removeShoppingItem(item.id)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`Fjern ${item.text}`}
                    >
                        <Ionicons name="close" size={20} color={colors.inkSoft} />
                    </Pressable>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    list: { padding: space.lg, paddingBottom: TAB_BAR_CLEARANCE, flexGrow: 1 },
    sectionHeader: { ...type.meta, color: colors.moss, marginTop: space.lg, marginBottom: space.sm },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        marginBottom: space.sm,
        ...shadow.card,
    },
    rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 32 },
    box: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        borderWidth: 2,
        borderColor: colors.line,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxChecked: { backgroundColor: colors.moss, borderColor: colors.moss },
    rowText: { ...type.body, color: colors.ink, flex: 1 },
    rowTextChecked: { color: colors.inkSoft, textDecorationLine: 'line-through' },
    footer: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
    secondaryButton: {
        flex: 1,
        alignItems: 'center',
        borderRadius: radius.pill,
        backgroundColor: colors.paperSunk,
        paddingVertical: space.md,
    },
    secondaryButtonText: { ...type.bodyStrong, color: colors.brown },
});
