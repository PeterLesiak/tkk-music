import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Constants from 'expo-constants';
import {
  CirclePlayIcon,
  CircleUserRoundIcon,
  LibraryBigIcon,
} from 'lucide-react-native';
import {
  differenceInHours,
  differenceInSeconds,
  formatDistanceToNow,
} from 'date-fns';
import { cn } from 'cn';

import { theme } from '~/theme';

export type Tab = 'libray' | 'home' | 'profile';

export function AppNavbar({
  className,
  ...props
}: ComponentProps<typeof View>) {
  const [currentTab, setCurrentTab] = useState<Tab>('home');

  const [timer, setTimer] = useState('loading...');
  const deadline = new Date(2026, 8, 13);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();

      const hoursLeft = differenceInHours(deadline, now);

      if (hoursLeft < 0) {
        setTimer('Deadline passed');

        return;
      }

      if (hoursLeft > 48) {
        setTimer(formatDistanceToNow(deadline, { addSuffix: true }));
        return;
      }

      const totalSeconds = differenceInSeconds(deadline, now);

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formattedTimer =
        `${String(hours).padStart(2, '0')}:` +
        `${String(minutes).padStart(2, '0')}:` +
        `${String(seconds).padStart(2, '0')}`;

      setTimer(formattedTimer);
    };

    updateTimer();

    const handle = setInterval(updateTimer, 1000);

    return () => clearInterval(handle);
  }, [deadline]);

  return (
    <View
      style={{ paddingBottom: Constants.statusBarHeight + 13 }}
      className={cn(
        'absolute bottom-0 box-content w-full bg-neutral-900',
        className,
      )}
      {...props}
    >
      <View className="flex flex-row items-center justify-evenly py-2.5">
        <Link href="/library" asChild>
          <Pressable
            onPress={() => setCurrentTab('libray')}
            className="flex items-center gap-1"
          >
            <LibraryBigIcon
              color={currentTab === 'libray' ? '#ffffff' : theme.muted}
              size={20}
            />

            <Text
              style={{
                color: currentTab === 'libray' ? '#ffffff' : theme.muted,
              }}
              className="text-xs"
            >
              Library
            </Text>
          </Pressable>
        </Link>

        <Link href="/" asChild>
          <Pressable
            onPress={() => setCurrentTab('home')}
            style={{ backgroundColor: theme.primary }}
            className="flex flex-row items-center gap-2 rounded-full px-4 py-2 active:opacity-80"
          >
            <CirclePlayIcon color="#ffffff" size={26} />

            <Text className="font-semibold text-white">{timer}</Text>
          </Pressable>
        </Link>

        <Link href="/profile" asChild>
          <Pressable
            onPress={() => setCurrentTab('profile')}
            className="flex items-center gap-1"
          >
            <CircleUserRoundIcon
              color={currentTab === 'profile' ? '#ffffff' : theme.muted}
              size={20}
            />

            <Text
              style={{
                color: currentTab === 'profile' ? '#ffffff' : theme.muted,
              }}
              className="text-xs"
            >
              Profile
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
