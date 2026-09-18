import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, type } from '../../src/theme/theme';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: colors.brown },
                headerTintColor: colors.paper,
                headerTitleStyle: { ...type.heading, color: colors.paper },
                tabBarActiveTintColor: colors.ember,
                tabBarInactiveTintColor: colors.inkSoft,
                tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
                sceneStyle: { backgroundColor: colors.paper },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Oppskrifter',
                    tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="favoritter"
                options={{
                    title: 'Favoritter',
                    tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="handleliste"
                options={{
                    title: 'Handleliste',
                    tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle-outline" color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="utstyr"
                options={{
                    title: 'Utstyr',
                    tabBarIcon: ({ color, size }) => <Ionicons name="flame-outline" color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
