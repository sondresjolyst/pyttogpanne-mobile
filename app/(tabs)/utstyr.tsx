import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { imageUrl } from '../../src/api/client';
import { useCatalog } from '../../src/store/catalog';
import { colors, radius, space, type } from '../../src/theme/theme';

export default function GearScreen() {
    const router = useRouter();
    const { gear, state, refresh } = useCatalog();

    return (
        <FlatList
            data={gear}
            keyExtractor={item => item.slug}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={state === 'syncing'} onRefresh={refresh} tintColor={colors.brown} />}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Ionicons name="flame-outline" size={36} color={colors.inkSoft} />
                    <Text style={styles.emptyTitle}>Ingen turtips ennå</Text>
                    <Text style={styles.emptyText}>Her kommer utstyr og råd for matlaging ute.</Text>
                </View>
            }
            renderItem={({ item }) => (
                <Pressable
                    onPress={() => router.push(`/utstyr/${item.slug}`)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                    {item.contentImageId ? (
                        <Image source={{ uri: imageUrl(item.contentImageId, 240) }} style={styles.thumb} contentFit="cover" />
                    ) : (
                        <View style={[styles.thumb, styles.thumbEmpty]}>
                            <Ionicons name="hammer-outline" size={20} color={colors.inkSoft} />
                        </View>
                    )}
                    <View style={styles.rowBody}>
                        <Text style={styles.kind}>{item.kind === 'Tips' ? 'Turtips' : 'Utstyr'}</Text>
                        <Text style={styles.title}>{item.title}</Text>
                        {item.summary ? <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.inkSoft} />
                </Pressable>
            )}
        />
    );
}

const styles = StyleSheet.create({
    list: { padding: space.lg, paddingBottom: space.xxl, flexGrow: 1 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        padding: space.md,
        marginBottom: space.sm,
    },
    pressed: { opacity: 0.85 },
    thumb: { width: 60, height: 60, borderRadius: radius.sm, backgroundColor: colors.paperSunk },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
    rowBody: { flex: 1, gap: 2 },
    kind: { ...type.meta, color: colors.moss },
    title: { ...type.bodyStrong, color: colors.ink },
    summary: { ...type.meta, color: colors.inkSoft },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
    emptyTitle: { ...type.heading, color: colors.ink },
    emptyText: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
});
