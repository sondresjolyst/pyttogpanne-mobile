import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import FloatingTabBar from '../../src/components/FloatingTabBar';
import { colors, space, type } from '../../src/theme/theme';

/**
 * A small mark beside the title on the first screen. Top left is where a logo is looked for,
 * and at this size it sits under the title rather than competing with it: the app icon and the
 * splash have already done the identifying.
 */
function Mark() {
    return (
        <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.mark}
            contentFit="contain"
            accessibilityLabel="Pyttogpanne"
        />
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            tabBar={props => <FloatingTabBar {...props} />}
            screenOptions={{
                headerStyle: { backgroundColor: colors.paper },
                headerShadowVisible: false,
                headerTintColor: colors.ink,
                headerTitleStyle: { ...type.title, color: colors.ink },
                sceneStyle: { backgroundColor: colors.paper },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Oppskrifter',
                    headerLeft: () => <Mark />,
                    headerRight: () => (
                        <Link href="/om" asChild>
                            <Pressable
                                hitSlop={10}
                                accessibilityRole="button"
                                accessibilityLabel="Om Pyttogpanne"
                                style={styles.about}
                            >
                                <Ionicons name="information-circle-outline" size={24} color={colors.ink} />
                            </Pressable>
                        </Link>
                    ),
                }}
            />
            <Tabs.Screen name="favoritter" options={{ title: 'Favoritter' }} />
            <Tabs.Screen name="handleliste" options={{ title: 'Handleliste' }} />
            <Tabs.Screen name="utstyr" options={{ title: 'Utstyr' }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    mark: { width: 28, height: 28, marginLeft: space.lg, marginRight: space.xs },
    about: { marginRight: space.lg },
});
