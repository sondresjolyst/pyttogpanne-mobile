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
                    <StatusBar style="dark" />
                    <Stack
                        screenOptions={{
                            headerStyle: { backgroundColor: colors.paper },
                            headerShadowVisible: false,
                            headerTintColor: colors.ink,
                            headerTitleStyle: { ...type.title, color: colors.ink },
                            contentStyle: { backgroundColor: colors.paper },
                        }}
                    >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="oppskrift/[slug]" options={{ title: '' }} />
                        <Stack.Screen name="utstyr/[slug]" options={{ title: '' }} />
                        <Stack.Screen name="om" options={{ title: 'Om Pyttogpanne' }} />
                        <Stack.Screen name="juridisk/[key]" options={{ title: '' }} />
                    </Stack>
                </ListsProvider>
            </CatalogProvider>
        </SafeAreaProvider>
    );
}
