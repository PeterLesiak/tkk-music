import { useEffect, type ComponentProps } from 'react';
import {
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LoaderCircleIcon, type LucideIcon } from 'lucide-react-native';

import { theme } from '~/theme';

const AnimatedLoaderCircleIcon = createAnimatedComponent(LoaderCircleIcon);

export function Spinner({ style, ...props }: ComponentProps<LucideIcon>) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
    );
  }, []);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <AnimatedLoaderCircleIcon
      color={theme.primary}
      size={20}
      style={[animatedStyles, style]}
      {...props}
    />
  );
}
