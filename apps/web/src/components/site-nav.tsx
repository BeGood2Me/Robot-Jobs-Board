'use client';

import { List, X } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SiteLogo } from './site-logo';

const links = [
  { href: '/', label: 'Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/guides', label: 'Guides' },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="shrink-0">
          <SiteLogo />
        </div>
        <nav className="flex shrink-0 items-center gap-3 rounded-full border border-line bg-background/80 px-3 py-2 shadow-sm backdrop-blur-xl">
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    active ? 'bg-chip text-foreground' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-full md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            <List
              size={18}
              className={`absolute transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'rotate-45 opacity-0' : 'opacity-100'}`}
            />
            <X
              size={18}
              className={`absolute transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0'}`}
            />
          </button>
        </nav>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-3xl md:hidden">
          <div className="flex h-full flex-col items-center justify-center gap-8">
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-3xl font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ transitionDelay: `${100 + index * 50}ms` }}
              >
                {link.label}
              </Link>
            ))}
            <button type="button" className="text-sm text-muted" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
