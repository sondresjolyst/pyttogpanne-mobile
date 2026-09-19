import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../theme/theme';

interface Props {
    icon?: keyof typeof Ionicons.glyphMap;
    title?: string;
    text: string;
}

/** What a screen shows instead of a list: why it is empty, and what to do about it. */
export default function EmptyState({ icon, title, text }: Props) {
    return (
        <View style={styles.empty}>
            {icon && <Ionicons name={icon} size={36} color={colors.inkSoft} />}
            {title && <Text style={styles.title}>{title}</Text>}
            <Text style={styles.text}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl },
    title: { ...type.heading, color: colors.ink },
    text: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
});
