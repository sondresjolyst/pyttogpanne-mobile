import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CatalogProvider } from '../src/store/catalog';
import { ListsProvider } from '../src/store/lists';
import { colors, type } from '../src/theme/theme';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <CatalogProvider>
                <ListsProvider>
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerStyle: { backgroundColor: colors.brown },
                            headerTintColor: colors.paper,
                            headerTitleStyle: { ...type.heading, color: colors.paper },
                            contentStyle: { backgroundColor: colors.paper },
                        }}
                    >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="oppskrift/[slug]" options={{ title: '', headerTransparent: true }} />
                        <Stack.Screen name="utstyr/[slug]" options={{ title: '' }} />
                    </Stack>
                </ListsProvider>
            </CatalogProvider>
        </SafeAreaProvider>
    );
}
