import { createFileRoute } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  BellElectricIcon,
  CalendarRangeIcon,
  ChevronDownIcon,
  ClockPlusIcon,
  ListChevronsUpDownIcon,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/_app/home')({ component: Home });

function Home() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <ScheduleHeader />
      </div>

      <ScheduleContent />
    </div>
  );
}

function ScheduleHeader() {
  return (
    <Collapsible>
      <CollapsibleTrigger
        nativeButton={false}
        render={
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold tracking-wider uppercase">
                piątek, 23 paź
              </span>
              <h2 className="text-3xl font-bold tracking-tight">Harmonogram</h2>
            </div>

            <Button variant="ghost" size="icon-xl" className="">
              <ListChevronsUpDownIcon />
            </Button>
          </div>
        }
      />
      <CollapsibleContent className="grid gap-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarRangeIcon size={20} /> Rodzaj dnia
          </div>
          <span className="font-medium">Standardowy</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellElectricIcon size={20} /> Do następnej przerwy
          </div>
          <span className="font-medium">14min</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockPlusIcon size={20} /> Całkowity czas muzyki
          </div>
          <span className="font-medium">32min</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

type ScheduleSlot = {
  id: string;
  startTime: string;
  endTime: string;
  trackCount?: number;
  tracksPlayed?: number;
  collapsed?: boolean;
  isPast?: boolean;
  isActive?: boolean;
};

const scheduleData: ScheduleSlot[] = [
  {
    id: 'slot-1',
    startTime: '08:45',
    endTime: '08:55',
    trackCount: 5,
    tracksPlayed: 5,
    isPast: true,
  },
  {
    id: 'slot-2',
    startTime: '09:40',
    endTime: '09:50',
  },
  {
    id: 'slot-3',
    startTime: '10:35',
    endTime: '10:45',
    trackCount: 5,
    tracksPlayed: 1,
    isActive: true,
  },
  {
    id: 'slot-4',
    startTime: '08:45',
    endTime: '08:55',
    trackCount: 5,
    tracksPlayed: 5,
    isPast: true,
  },
  {
    id: 'slot-5',
    startTime: '09:40',
    endTime: '09:50',
  },
  {
    id: 'slot-6',
    startTime: '10:35',
    endTime: '10:45',
    trackCount: 5,
    tracksPlayed: 1,
    isActive: true,
  },
];

function ScheduleContent() {
  return (
    <div className="scroll-fade-y relative flex-1 overflow-y-auto pt-6 pb-28">
      <div className="flex flex-col gap-10">
        {scheduleData.map(slot => (
          <div key={slot.id} className="relative flex gap-4">
            <div
              className={`${slot.trackCount ? 'justify-between' : 'gap-10'} flex w-12 shrink-0 flex-col py-0.5 text-sm`}
            >
              <span
                className={`${slot.isPast ? 'opacity-50' : ''} leading-none font-medium`}
              >
                {slot.startTime}
              </span>
              <span
                className={`${slot.isPast ? 'opacity-50' : ''} leading-none font-medium`}
              >
                {slot.endTime}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-center pr-4">
              {slot.trackCount ? (
                <Collapsible
                  className={`${slot.isPast ? 'opacity-50' : ''} ${slot.isActive ? 'bg-accent/40 border-accent/70' : 'bg-secondary'} group grid w-full gap-2 rounded-md border p-3`}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold">
                      Odtworzono {slot.tracksPlayed} z 5
                    </span>

                    <ChevronDownIcon
                      size={18}
                      className="transition group-data-open:rotate-180"
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="grid gap-2">
                    <div className="flex items-center gap-2 p-1">
                      <img
                        src="/music-thumbnail.png"
                        className="aspect-square size-7 rounded object-cover opacity-90"
                      />
                      <div className="grid">
                        <span className="truncate text-xs leading-tight font-semibold">
                          Mango 67 Musztarda
                        </span>
                        <span className="truncate text-[9px] tracking-wider">
                          Discoadamus
                        </span>
                      </div>

                      <AudioLinesIcon size={18} className="ml-auto" />
                    </div>

                    <div className="flex items-center gap-2 p-1">
                      <img
                        src="/music-thumbnail.png"
                        className="aspect-square size-7 rounded object-cover opacity-90"
                      />
                      <div className="grid">
                        <span className="truncate text-xs leading-tight font-semibold">
                          Manga 67 Musztarda
                        </span>
                        <span className="truncate text-[9px]">Discoadamus</span>
                      </div>

                      <AudioLinesIcon size={18} className="ml-auto" />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div className="pl-1 text-sm font-medium brightness-60">
                  Brak utworów
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <span className="pointer-events-none absolute top-[82%] right-0 left-5 h-0.5 rounded-full bg-red-500 drop-shadow-sm">
        <span className="absolute top-1/2 left-[-0.95rem] size-3 -translate-y-1/2 animate-ping rounded-full bg-red-500 opacity-50"></span>
        <span className="ring-background absolute top-1/2 -left-3.5 size-2.5 -translate-y-1/2 rounded-full bg-red-500"></span>
      </span>
    </div>
  );
}
