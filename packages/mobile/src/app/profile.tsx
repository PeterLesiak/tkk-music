import { Text, TextInput, View } from 'react-native';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import {
  BadgeCheckIcon,
  HeartIcon,
  LogOutIcon,
  PaletteIcon,
  UserIcon,
  UserRoundPenIcon,
} from 'lucide-react-native';

import { Tabs, type Tab } from '~/components/tabs';
import { DestructiveButton } from '~/components/button';
import { Spinner } from '~/components/spinner';
import { theme } from '~/theme';

const tabs: Tab[] = [
  { id: 'account', label: 'Account', icon: UserIcon },
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { id: 'favori·tes', label: 'Favorites', icon: HeartIcon },
];

export default function Profile() {
  return (
    <View className="flex-1 bg-neutral-950">
      <View className="absolute inset-0">
        <Svg height="100%" width="100%" className="absolute inset-0">
          <Defs>
            <RadialGradient id="blob1" cx="25%" cy="10%" r="60%">
              <Stop offset="0" stopColor={theme.primary} stopOpacity="0.25" />

              <Stop offset="1" stopColor={theme.primary} stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="blob2" cx="80%" cy="30%" r="70%">
              <Stop offset="0" stopColor={theme.secondary} stopOpacity="0.2" />

              <Stop offset="1" stopColor={theme.secondary} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob1)" />

          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob2)" />
        </Svg>
      </View>

      <View className="relative mt-40 flex-1 rounded-t-[2.5rem] bg-neutral-800/90">
        <View className="absolute -top-10.25 left-1/2 flex h-20.5 w-20.5 -translate-x-1/2 items-center justify-center rounded-full border-[1.5px] border-black/40 bg-[#ef6c00]">
          <Text className="text-4xl font-medium text-white">P</Text>
        </View>

        <View className="mx-auto mt-15 flex flex-row items-center gap-2">
          <Text className="text-2xl font-semibold text-white">
            Piotr Lesiak
          </Text>
          <BadgeCheckIcon fill="#f4ec22" size={28} className="mt-0.5" />
        </View>

        <Tabs tabs={tabs} className="mt-4" />

        <View className="flex flex-1 gap-6 px-4 pt-7">
          <View className="relative mt-3">
            <View className="relative h-14 justify-center rounded-lg border border-slate-500">
              <View className="absolute -top-2.5 left-3 z-10 bg-neutral-800 px-1.5">
                <Text className="text-xs font-medium text-slate-300">
                  Customize Your Profile Name
                </Text>
              </View>

              <View className="absolute left-4 z-10">
                <UserRoundPenIcon color={theme.primary} size={20} />
              </View>

              <TextInput
                defaultValue="Piotr Lesiak"
                placeholder="Enter your name"
                placeholderTextColor={theme.muted}
                autoCorrect={false}
                className="h-full flex-1 px-12 text-base text-white"
              />

              <View className="absolute right-4 z-10">
                <Spinner />
              </View>
            </View>
          </View>

          <DestructiveButton>
            <LogOutIcon color="#ff6467" size={20} />

            <Text className="relative text-base font-medium text-red-400">
              Log Out
            </Text>
          </DestructiveButton>
        </View>
      </View>
    </View>
  );
}
