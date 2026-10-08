import type { PropsWithChildren } from 'react';

import { NavigationBar } from '~/components/navigation-bar';
import { ThemeProvider } from '~/components/theme-provider';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="system">
      <div className="relative min-h-dvh">
        <div className="h-full p-6">{children}</div>

        <NavigationBar />
      </div>
    </ThemeProvider>
  );
}
