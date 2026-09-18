import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { imageUrl } from '../../src/api/client';
import { useCatalog } from '../../src/store/catalog';
import { colors, radius, space, type } from '../../src/theme/theme';

/**
 * The body is markdown written in the admin console. Rather than pull in a markdown
 * renderer for what is in practice paragraphs, headings and bullets, the few marks that
 * show up are handled here and anything else is shown as written.
 */
function renderBody(body: string) {
    return body.split(/\n{2,}/).map((block, index) => {
        const text = block.trim();
        if (text === '') return null;

        if (text.startsWith('## ')) {
            return <Text key={index} style={styles.heading}>{text.replace(/^##\s+/, '')}</Text>;
        }
        if (text.startsWith('# ')) {
            return <Text key={index} style={styles.headingLarge}>{text.replace(/^#\s+/, '')}</Text>;
        }
        if (/^[-*]\s+/m.test(text)) {
            return (
                <View key={index} style={styles.bullets}>
                    {text.split('\n').map((line, lineIndex) => (
                        <View key={lineIndex} style={styles.bulletRow}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.paragraph}>{line.replace(/^[-*]\s+/, '')}</Text>
                        </View>
                    ))}
                </View>
            );
        }
        return <Text key={index} style={styles.paragraph}>{text}</Text>;
    });
}

export default function GearItemScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { gear } = useCatalog();
    const item = gear.find(entry => entry.slug === slug);

    if (!item) {
        return (
            <View style={styles.missing}>
                <Ionicons name="help-circle-outline" size={36} color={colors.inkSoft} />
                <Text style={styles.missingTitle}>Fant ikke siden</Text>
                <Text style={styles.missingText}>Den kan være fjernet. Dra ned på utstyrslisten for å oppdatere.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
            <Stack.Screen options={{ title: item.kind === 'Tips' ? 'Turtips' : 'Utstyr' }} />

            {item.contentImageId ? (
                <Image source={{ uri: imageUrl(item.contentImageId, 1200) }} style={styles.hero} contentFit="cover" transition={150} />
            ) : null}

            <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
                {renderBody(item.body)}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { backgroundColor: colors.paper },
    page: { paddingBottom: space.xxl },
    hero: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.paperSunk },
    body: { padding: space.lg, gap: space.md },
    title: { ...type.display, color: colors.ink },
    summary: { ...type.body, color: colors.moss },
    headingLarge: { ...type.title, color: colors.ink, marginTop: space.md },
    heading: { ...type.heading, color: colors.brown, marginTop: space.md },
    paragraph: { ...type.body, color: colors.ink, flex: 1 },
    bullets: { gap: space.xs },
    bulletRow: { flexDirection: 'row', gap: space.sm },
    bulletDot: { ...type.body, color: colors.ember },
    missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl, backgroundColor: colors.paper },
    missingTitle: { ...type.title, color: colors.ink },
    missingText: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
});
