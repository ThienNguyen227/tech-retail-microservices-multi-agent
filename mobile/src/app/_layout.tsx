
import '@/global.css';

import { NavigationBar } from 'expo-navigation-bar';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <NavigationBar
          style={colorScheme === 'dark' ? 'light' : 'dark'}
        />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="customer" options={{ headerShown: false }} />
        </Stack>
        <NavigationBarBackground colorScheme={colorScheme} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function NavigationBarBackground({
  colorScheme,
}: {
  colorScheme: ReturnType<typeof useColorScheme>;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: insets.bottom,
        backgroundColor: colorScheme === 'dark' ? '#000000' : '#eef6f7',
      }}
    />
  );
}
