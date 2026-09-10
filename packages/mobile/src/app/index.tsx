import { Text, TextInput, View } from 'react-native';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import { BadgeCheckIcon, UserRoundPenIcon } from 'lucide-react-native';

import { Spinner } from '~/components/spinner';

export default function Home() {
  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <View className="absolute inset-0">
        <Svg height="100%" width="100%" className="absolute inset-0">
          <Defs>
            <RadialGradient id="blob1" cx="25%" cy="10%" r="60%">
              <Stop offset="0" stopColor="#8b5cf6" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="blob2" cx="80%" cy="30%" r="70%">
              <Stop offset="0" stopColor="#3b82f6" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob2)" />
        </Svg>
      </View>

      <View className="relative z-10 mt-45 flex-1 rounded-[38px] bg-[#2f2f2f]">
        <View className="absolute -top-10.25 left-1/2 flex h-20.5 w-20.5 -translate-x-1/2 items-center justify-center rounded-full border-[1.5px] border-black bg-[#ef6c00]">
          <Text className="text-4xl font-medium text-white">P</Text>
        </View>

        <View className="mx-auto mt-15 flex flex-row items-center gap-2">
          <Text className="text-2xl font-semibold text-white">
            Piotr Lesiak
          </Text>
          <BadgeCheckIcon fill="#f4ec22" size={28} className="mt-0.5" />
        </View>

        <View className="flex-1 px-4 pt-12">
          <Text className="mb-3 ml-1 text-sm font-medium text-slate-300">
            Customize Your Profile Name
          </Text>

          <View className="relative h-14 justify-center rounded-xl border border-slate-700 bg-slate-800/70">
            <View className="absolute left-4">
              <UserRoundPenIcon color="#94a3b8" size={20} />
            </View>

            <TextInput
              value="Piotr Lesiak"
              placeholder="Enter your name"
              placeholderTextColor="#475569"
              autoCorrect={false}
              className="h-full flex-1 px-12 text-base text-white"
            />

            <View className="absolute right-4 z-10">
              <Spinner />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
