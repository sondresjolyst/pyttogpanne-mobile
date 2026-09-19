import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { imageUrl } from '../../src/api/client';
import AdvertisingLabel from '../../src/components/AdvertisingLabel';
import { useCatalog } from '../../src/store/catalog';
import EmptyState from '../../src/components/EmptyState';
import { colors, radius, shadow, space, type, TAB_BAR_CLEARANCE } from '../../src/theme/theme';

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
                <EmptyState
                    icon="flame-outline"
                    title="Ingen turtips ennå"
                    text="Her kommer utstyr og råd for matlaging ute."
                />
            }
            renderItem={({ item }) => (
                <Pressable
                    onPress={() => router.push(`/utstyr/${item.slug}`)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                    {item.coverImageId ? (
                        <Image source={{ uri: imageUrl(item.coverImageId, 240) }} style={styles.thumb} contentFit="cover" />
                    ) : (
                        <View style={[styles.thumb, styles.thumbEmpty]}>
                            <Ionicons name="hammer-outline" size={20} color={colors.inkSoft} />
                        </View>
                    )}
                    <View style={styles.rowBody}>
                        {item.isAdvertising && <AdvertisingLabel advertiser={item.advertiser} compact />}
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
    list: { padding: space.lg, paddingBottom: TAB_BAR_CLEARANCE, flexGrow: 1 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: space.md,
        marginBottom: space.sm,
        ...shadow.card,
    },
    pressed: { opacity: 0.85 },
    thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.paperSunk },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
    rowBody: { flex: 1, gap: 2 },
    kind: { ...type.meta, color: colors.moss },
    title: { ...type.bodyStrong, color: colors.ink },
    summary: { ...type.meta, color: colors.inkSoft },
});
