import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => ({
    scripts: [
      {
        // Instanlty navigates to /home if running PWA
        children: `
          if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            window.location.replace('/home');
          }
        `,
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>install this app to see its content</div>;
}
