import { useRef, useState, useEffect, type ReactNode } from 'react';
import Icon from '@/components/ui/icon';

interface ScrollableTabsProps {
  children: ReactNode;
}

export default function ScrollableTabs({ children }: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -120 : 120, behavior: 'smooth' });
  };

  return (
    <div className="relative sm:static">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-background/90 border shadow-sm sm:hidden"
        >
          <Icon name="ChevronLeft" size={16} className="text-muted-foreground" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-background/90 border shadow-sm sm:hidden"
        >
          <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
