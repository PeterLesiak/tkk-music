import { Slot } from 'expo-router';
import { View } from 'react-native';
// import * as SplashScreen from 'expo-splash-screen';

import { AppNavbar } from '~/components/app-navbar';
import '~/global.css';

// TODO: Add this back when app gets more complex
// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <View className="flex-1">
      <Slot />

      <AppNavbar />
    </View>
  );
}
