import type { ComponentProps } from 'react';
import { Link, MatchRoute } from '@tanstack/react-router';
import { LibraryIcon, MusicIcon, UserRoundIcon } from 'lucide-react';
import { cn } from 'cn';

export function NavigationBar({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      className={cn(
        'bg-card border-border/40 fixed right-0 bottom-1.5 left-0 mx-2 rounded-full border-[1.5px] border-x-rose-400 py-2.5 shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="grid grid-cols-3 px-4">
        <MatchRoute to="/library">
          {match => (
            <Link
              to="/library"
              className={`${match ? 'text-rose-400' : ''} flex flex-col items-center gap-1.5`}
            >
              <LibraryIcon size={18} />
              <span className="text-xs">Katalog</span>
            </Link>
          )}
        </MatchRoute>

        <MatchRoute to="/">
          {match => (
            <Link
              to="/"
              className={`${match ? 'text-rose-400' : ''} flex flex-col items-center gap-1.5`}
            >
              <MusicIcon size={18} />
              <span className="text-xs">Muzyka</span>
            </Link>
          )}
        </MatchRoute>

        <MatchRoute to="/profile">
          {match => (
            <Link
              to="/profile"
              className={`${match ? 'text-rose-400' : ''} flex flex-col items-center gap-1.5`}
            >
              <UserRoundIcon size={18} />
              <span className="text-xs">Konto</span>
            </Link>
          )}
        </MatchRoute>
      </div>
    </nav>
  );
}
