import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../theme/theme';

/**
 * The advertising label, in the only wording Forbrukertilsynet treats as always clear enough:
 * "Reklame". It sits at the top of an item and is never hidden behind a tap or a scroll, so a
 * reader sees it before the content it applies to.
 */
export default function AdvertisingLabel({ advertiser, compact }: { advertiser?: string | null; compact?: boolean }) {
    return (
        <View style={[styles.label, compact && styles.compact]}>
            <Text style={[styles.text, compact && styles.textCompact]}>
                Reklame{advertiser ? ` · ${advertiser}` : ''}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    label: {
        alignSelf: 'flex-start',
        backgroundColor: colors.ember,
        borderRadius: radius.pill,
        paddingHorizontal: space.md,
        paddingVertical: space.xs,
    },
    compact: { paddingHorizontal: space.sm, paddingVertical: 2 },
    text: {
        color: colors.paper,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    textCompact: { fontSize: 11, lineHeight: 15 },
});
