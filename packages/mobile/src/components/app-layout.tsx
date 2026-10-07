import type { PropsWithChildren } from 'react';

import { ThemeProvider } from '~/components/theme-provider';

export function AppLayout({ children }: PropsWithChildren) {
  return <ThemeProvider defaultTheme="system">{children}</ThemeProvider>;
}
