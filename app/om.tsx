import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCatalog } from '../src/store/catalog';
import { LEGAL_KEYS, type LegalKey } from '../src/api/types';
import { colors, radius, shadow, space, type, TAB_BAR_CLEARANCE } from '../src/theme/theme';

const INSTAGRAM = 'https://www.instagram.com/pyttogpanne/';
const MAKER = 'https://www.sjolystinnovation.no/';

const FALLBACK_TITLES: Record<LegalKey, string> = {
    terms: 'Vilkår',
    privacy: 'Personvern',
    cookies: 'Informasjonskapsler',
};

export default function AboutScreen() {
    const router = useRouter();
    const { legal, recipes } = useCatalog();

    const titleOf = (key: LegalKey) => legal.find(page => page.key === key)?.title ?? FALLBACK_TITLES[key];

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
            <View style={styles.hero}>
                <Image
                    source={require('../assets/splash-icon.png')}
                    style={styles.badge}
                    contentFit="contain"
                    accessibilityLabel="Pyttogpanne"
                />
                <Text style={styles.intro}>Turmat laget i én panne.</Text>
            </View>

            <Pressable
                onPress={() => Linking.openURL(INSTAGRAM)}
                accessibilityRole="link"
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
                <Ionicons name="logo-instagram" size={20} color={colors.brown} />
                <Text style={styles.rowText}>@pyttogpanne</Text>
                <Ionicons name="open-outline" size={18} color={colors.inkSoft} />
            </Pressable>

            <Text style={styles.sectionTitle}>Vilkår og personvern</Text>
            <View style={styles.group}>
                {LEGAL_KEYS.map(key => (
                    <Pressable
                        key={key}
                        onPress={() => router.push(`/juridisk/${key}`)}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                    >
                        <Ionicons name="document-text-outline" size={20} color={colors.brown} />
                        <Text style={styles.rowText}>{titleOf(key)}</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
                    </Pressable>
                ))}
            </View>

            <Text style={styles.note}>
                {recipes.length > 0
                    ? `${recipes.length} oppskrifter er lagret på telefonen og virker uten dekning.`
                    : 'Oppskriftene lagres på telefonen, så de virker uten dekning.'}
            </Text>

            <Pressable onPress={() => Linking.openURL(MAKER)} accessibilityRole="link" hitSlop={8}>
                <Text style={styles.credit}>Drives av Sjølyst Innovation AS</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { backgroundColor: colors.paper },
    page: { padding: space.lg, paddingBottom: TAB_BAR_CLEARANCE, gap: space.md },
    hero: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
    badge: { width: 120, height: 120 },
    intro: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
    sectionTitle: { ...type.heading, color: colors.ink, marginTop: space.lg },
    group: { gap: space.sm },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        paddingHorizontal: space.lg,
        paddingVertical: space.lg,
        ...shadow.card,
    },
    pressed: { opacity: 0.9 },
    rowText: { ...type.bodyStrong, color: colors.ink, flex: 1 },
    note: { ...type.meta, color: colors.inkSoft, textAlign: 'center', marginTop: space.lg },
    credit: { ...type.meta, color: colors.inkSoft, textAlign: 'center', opacity: 0.7 },
});
