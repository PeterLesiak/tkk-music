import { createFileRoute, Outlet } from '@tanstack/react-router';

import { NavigationBar } from '~/components/navigation-bar';

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
  notFoundComponent: NotFoundComponent,
});

function RouteComponent() {
  return (
    <div className="h-full">
      <NavigationBar />

      <div className="h-full p-6">
        <Outlet />
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return <p>Not Found</p>;
}
