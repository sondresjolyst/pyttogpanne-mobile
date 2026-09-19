import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import EmptyState from '../../src/components/EmptyState';
import Markdown from '../../src/components/Markdown';
import { useCatalog } from '../../src/store/catalog';
import { colors, space, type, TAB_BAR_CLEARANCE } from '../../src/theme/theme';

const updatedOn = (iso: string): string =>
    new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });

export default function LegalScreen() {
    const { key } = useLocalSearchParams<{ key: string }>();
    const { legal } = useCatalog();
    const page = legal.find(entry => entry.key === key);

    if (!page) {
        return (
            <EmptyState
                icon="document-text-outline"
                title="Ikke lastet ned ennå"
                text="Koble til nett og dra ned på oppskriftslisten, så lagres teksten på telefonen."
            />
        );
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
            <Stack.Screen options={{ title: page.title }} />

            <View style={styles.body}>
                <Text style={styles.title}>{page.title}</Text>
                <Markdown body={page.bodyMarkdown} />
                <Text style={styles.updated}>Sist oppdatert {updatedOn(page.updatedAt)}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { backgroundColor: colors.paper },
    page: { paddingBottom: TAB_BAR_CLEARANCE },
    body: { padding: space.lg, gap: space.md },
    title: { ...type.display, color: colors.ink },
    updated: { ...type.meta, color: colors.inkSoft, marginTop: space.lg },
});
