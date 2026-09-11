import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from 'cn';

export function ActionButton({
  children,
  className,
  ...props
}: ComponentProps<typeof Pressable>) {
  return (
    <Pressable
      className={cn(
        'relative h-12 items-center justify-center overflow-hidden rounded-md shadow-2xl active:opacity-80',
        className,
      )}
      {...props}
    >
      <LinearGradient
        colors={['#db2777', '#7e22ce', '#60a5fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <View className="absolute inset-0 rounded-md border border-white/10" />

      <View className="flex flex-row items-center gap-2">
        {children as ReactNode}
      </View>
    </Pressable>
  );
}
