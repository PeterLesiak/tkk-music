import { useState, type ComponentProps } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from 'cn';

import { theme } from '~/theme';

export type Tab = { id: string; label: string; icon: LucideIcon };

export function Tabs({
  tabs,
  className,
  ...props
}: ComponentProps<typeof View> & { tabs: Tab[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tabWidth, setTabWidth] = useState(0);

  const slideOffset = useSharedValue(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const newWidth = event.nativeEvent.layout.width / tabs.length;

    slideOffset.set(activeIndex * newWidth);
    setTabWidth(newWidth);
  };

  const handleTabPress = (index: number) => {
    setActiveIndex(index);

    slideOffset.value = withSpring(index * tabWidth);
  };

  return (
    <View
      onLayout={handleLayout}
      className={cn(
        'relative mx-4 flex-row border-b border-slate-700/50',
        className,
      )}
      {...props}
    >
      {tabs.map((tab, index) => {
        const isActive = activeIndex === index;
        const Icon = tab.icon;

        return (
          <Pressable
            key={tab.id}
            onPress={() => handleTabPress(index)}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-4"
          >
            <Icon size={18} color={isActive ? theme.primary : theme.muted} />
            <Text
              style={{ color: isActive ? theme.primary : theme.muted }}
              className="text-sm font-medium"
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}

      {tabWidth > 0 && (
        <Animated.View
          style={{
            width: tabWidth,
            transform: [{ translateX: slideOffset }],
            backgroundColor: theme.primary,
          }}
          className="absolute bottom-0 h-0.5 rounded-t-full"
        />
      )}
    </View>
  );
}
