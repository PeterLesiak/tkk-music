import type { ComponentProps } from 'react';
import { HeartIcon, ListMusicIcon } from 'lucide-react';
import { cn } from 'cn';

import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from '~/components/ui/progress';
import { Button } from '~/components/ui/button';

export function StickyPlayer({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('sticky px-4 py-4', className)} {...props}>
      <div className="grid overflow-hidden rounded-md border-t border-r border-l bg-neutral-800/70 backdrop-blur-lg">
        <div className="flex items-center p-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm">
            <img src="/music-thumbnail.png" className="aspect-square" />
          </div>

          <div className="ml-3 grid overflow-hidden">
            <span className="truncate text-sm font-semibold">
              NIENAWIDZĘ WARSZAWY
            </span>
            <span className="truncate text-xs">Otsochodzi, lohleq</span>
          </div>

          <div className="relative -bottom-0.5 ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon-lg">
              <HeartIcon />
            </Button>
            <Button variant="ghost" size="icon-lg">
              <ListMusicIcon />
            </Button>
          </div>
        </div>

        <Progress
          value={60}
          render={
            <ProgressTrack className="rounded-none">
              <ProgressIndicator />
            </ProgressTrack>
          }
        />
      </div>
    </div>
  );
}
