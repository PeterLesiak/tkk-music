import type { ComponentProps } from 'react';
import { Link, MatchRoute } from '@tanstack/react-router';
import { LibraryIcon, MusicIcon, UserRoundIcon } from 'lucide-react';
import { cn } from 'cn';

export function NavigationBar({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      className={cn(
        'bg-card border-border/40 border-x-primary fixed right-0 bottom-1 left-0 mx-1.5 rounded-full border-[1.5px] py-2.5 shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="grid grid-cols-3 items-center px-4">
        <MatchRoute fuzzy to="/library">
          {match => (
            <Link
              to="/library"
              className={`${match ? 'text-primary' : ''} flex flex-col items-center gap-1.5`}
            >
              <LibraryIcon size={18} />
              <span className="text-xs font-medium">Katalog</span>
            </Link>
          )}
        </MatchRoute>

        <MatchRoute fuzzy to="/home">
          {match => (
            <Link
              to="/home"
              className={`${match ? 'text-primary' : ''} flex flex-col items-center gap-1.5`}
            >
              <MusicIcon size={18} />
              <span className="text-xs font-medium">Muzyka</span>
            </Link>
          )}
        </MatchRoute>

        <MatchRoute fuzzy to="/profile">
          {match => (
            <Link
              to="/profile"
              className={`${match ? 'text-primary' : ''} flex flex-col items-center gap-1.5`}
            >
              <UserRoundIcon size={18} />
              <span className="text-xs font-medium">Konto</span>
            </Link>
          )}
        </MatchRoute>
      </div>
    </nav>
  );
}
