import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Markdown from '../../src/components/Markdown';
import PhotoGallery from '../../src/components/PhotoGallery';
import AdvertisingLabel from '../../src/components/AdvertisingLabel';
import { useCatalog } from '../../src/store/catalog';
import EmptyState from '../../src/components/EmptyState';
import { colors, radius, space, type, TAB_BAR_CLEARANCE } from '../../src/theme/theme';

export default function GearItemScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { gear } = useCatalog();
    const item = gear.find(entry => entry.slug === slug);

    if (!item) {
        return (
            <EmptyState
                icon="help-circle-outline"
                title="Fant ikke siden"
                text="Den kan være fjernet. Dra ned på utstyrslisten for å oppdatere."
            />
        );
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
            <Stack.Screen options={{ title: item.kind === 'Tips' ? 'Turtips' : 'Utstyr' }} />

            {item.isAdvertising && (
                <View style={styles.disclosure}>
                    <AdvertisingLabel advertiser={item.advertiser} />
                </View>
            )}

            <PhotoGallery images={item.images} />

            <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
                <Markdown body={item.body} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { backgroundColor: colors.paper },
    page: { paddingBottom: TAB_BAR_CLEARANCE },
    disclosure: { paddingHorizontal: space.lg, paddingTop: space.md },
    body: { padding: space.lg, gap: space.md },
    title: { ...type.display, color: colors.ink },
    summary: { ...type.body, color: colors.moss },
});
