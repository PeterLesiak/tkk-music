import type { PropsWithChildren } from 'react';

import { ThemeProvider } from '~/components/theme-provider';

export function RootProvider({ children }: PropsWithChildren) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
