
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="otp"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

