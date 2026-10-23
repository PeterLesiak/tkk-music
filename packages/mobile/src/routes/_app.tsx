import { createFileRoute, Outlet } from '@tanstack/react-router';

import { StickyPlayer } from '~/components/sticky-player';
import { NavigationBar } from '~/components/navigation-bar';

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
  notFoundComponent: NotFoundComponent,
});

function RouteComponent() {
  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute top-0 left-0 z-0 h-1/3 w-full bg-linear-to-b from-zinc-700/20 to-transparent"></div>

      <StickyPlayer />

      <Outlet />

      <NavigationBar />
    </div>
  );
}

function NotFoundComponent() {
  return <p>Not Found</p>;
}
