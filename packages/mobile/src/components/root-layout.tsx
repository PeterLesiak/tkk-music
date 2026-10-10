import type { PropsWithChildren } from 'react';

import { ThemeProvider } from '~/components/theme-provider';

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <div className="relative min-h-dvh">{children}</div>
    </ThemeProvider>
  );
}
