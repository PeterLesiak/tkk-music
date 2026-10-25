import { createFileRoute } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import {
  ChevronRightIcon,
  CircleQuestionMarkIcon,
  InfoIcon,
  LogOutIcon,
  MoonIcon,
  PaintbrushVerticalIcon,
  ShieldLockIcon,
  UserRoundIcon,
} from 'lucide-react';
import { cn } from 'cn';

import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/_app/profile')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="no-scrollbar flex h-full flex-col gap-6 overflow-y-auto pb-22">
      <div className="flex flex-col items-center gap-1">
        <Avatar className="mt-2 mb-4 size-22">
          <AvatarFallback className="bg-orange-400 text-4xl font-semibold text-white">
            PL
          </AvatarFallback>
        </Avatar>
        <span className="text-2xl font-semibold">Piotr Lesiak</span>
        <span className="text-subtext font-medium">@piotr.lesiak</span>
      </div>

      <Group>
        <GroupLabel>Konto</GroupLabel>
        <GroupContent>
          <GroupNavigationItem>
            <UserRoundIcon /> Dane osobiste
          </GroupNavigationItem>
          <GroupNavigationItem>
            <ShieldLockIcon /> Prywatność i bezpieczeństwo
          </GroupNavigationItem>
        </GroupContent>
      </Group>

      <Group>
        <GroupLabel>Wygląd aplikacji</GroupLabel>
        <GroupContent>
          <GroupNavigationItem displayValue="Ciemny">
            <MoonIcon /> Motyw
          </GroupNavigationItem>
          <GroupNavigationItem displayValue="Rose">
            <PaintbrushVerticalIcon /> Akcent koloru
          </GroupNavigationItem>
        </GroupContent>
      </Group>

      <Group>
        <GroupContent>
          <GroupTextItem displayValue="Wersja 2.4.1">
            <InfoIcon /> O aplikacji
          </GroupTextItem>
          <GroupNavigationItem>
            <CircleQuestionMarkIcon /> Pomoc i wsparcie
          </GroupNavigationItem>
        </GroupContent>
      </Group>

      <Group>
        <GroupContent>
          <GroupDestructiveItem>
            <LogOutIcon /> Wyloguj się
          </GroupDestructiveItem>
        </GroupContent>
      </Group>
    </div>
  );
}

function Group({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-2.5', className)} {...props} />;
}

function GroupLabel({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'text-subtext ml-1 text-xs font-bold tracking-wider uppercase',
        className,
      )}
      {...props}
    />
  );
}

function GroupContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-card grid overflow-hidden rounded-lg border *:not-last:border-b',
        className,
      )}
      {...props}
    />
  );
}

function GroupNavigationItem({
  displayValue,
  className,
  children,
  ...props
}: ComponentProps<typeof Button> & { displayValue?: string }) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'border-border justify-between rounded-none border-0 px-5 py-8',
        className,
      )}
      {...props}
    >
      <div className="[&_svg]:text-subtext flex items-center gap-3 text-[17px] font-medium [&_svg:not([class*='size-'])]:size-5!">
        {children}
      </div>

      <div className="text-subtext flex items-center gap-2 text-sm">
        {displayValue}
        <ChevronRightIcon />
      </div>
    </Button>
  );
}

function GroupTextItem({
  displayValue,
  className,
  children,
  ...props
}: ComponentProps<typeof Button> & { displayValue: string }) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'border-border justify-between rounded-none border-0 px-5 py-8',
        className,
      )}
      {...props}
    >
      <div className="[&_svg]:text-subtext flex items-center gap-3 text-[17px] font-medium [&_svg:not([class*='size-'])]:size-5!">
        {children}
      </div>

      <div className="text-subtext flex items-center gap-2 text-sm">
        {displayValue}
      </div>
    </Button>
  );
}

function GroupDestructiveItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'border-border **:text-destructive rounded-none border-0 px-5 py-7',
        className,
      )}
      {...props}
    >
      <div className="[&_svg]:text-subtext flex items-center gap-3 text-[17px] font-medium [&_svg:not([class*='size-'])]:size-5!">
        {children}
      </div>
    </Button>
  );
}
