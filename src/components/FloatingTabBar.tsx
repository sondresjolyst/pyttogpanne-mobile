import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import { colors, radius, shadow, space } from '../theme/theme';

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
    index: { on: 'restaurant', off: 'restaurant-outline' },
    favoritter: { on: 'heart', off: 'heart-outline' },
    handleliste: { on: 'bag-handle', off: 'bag-handle-outline' },
    utstyr: { on: 'flame', off: 'flame-outline' },
};

/**
 * Taken from Tabs itself rather than @react-navigation/bottom-tabs: expo-router bundles its
 * own copy, and a second one in package.json resolves to an incompatible type identity.
 */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** The tab bar as a pill floating over the content, rather than a bar welded to the bottom. */
export default function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.md) }]} pointerEvents="box-none">
            <View style={styles.bar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.title ?? route.name;
                    const focused = state.index === index;
                    const icon = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };

                    const onPress = () => {
                        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                        if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                    };

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                            accessibilityRole="button"
                            accessibilityState={{ selected: focused }}
                            accessibilityLabel={label}
                            style={[styles.tab, focused && styles.tabActive]}
                        >
                            <Ionicons
                                name={focused ? icon.on : icon.off}
                                size={21}
                                color={focused ? colors.ember : colors.paperSunk}
                            />
                            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                                {label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        backgroundColor: colors.brown,
        borderRadius: radius.pill,
        paddingHorizontal: space.sm,
        paddingVertical: space.sm,
        ...shadow.float,
    },
    tab: {
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.pill,
        minWidth: 64,
    },
    tabActive: { backgroundColor: 'rgba(250, 246, 236, 0.12)' },
    label: { fontSize: 11, fontWeight: '600', color: colors.paperSunk, opacity: 0.75 },
    labelActive: { color: colors.ember, opacity: 1 },
});
