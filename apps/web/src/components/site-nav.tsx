'use client';

import { List, X } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SiteLogo } from './site-logo';

const links = [
  { href: '/', label: 'Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/guides', label: 'Guides' },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/95 backdrop-blur-xl">
      <div className="relative z-[60] mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="min-w-0 shrink-0">
          <SiteLogo />
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                  active ? 'bg-chip text-foreground' : 'text-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-background md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <List
            size={20}
            aria-hidden
            className={`absolute transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}
          />
          <X
            size={20}
            aria-hidden
            className={`absolute transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
          />
        </button>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-[55] bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="fixed inset-x-0 top-16 z-[56] max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-line bg-background shadow-lg md:hidden"
          >
            <ul className="mx-auto max-w-6xl px-6 py-3">
              {links.map((link) => {
                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-12 items-center rounded-lg px-3 text-base font-semibold ${
                        active ? 'bg-chip text-foreground' : 'text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      ) : null}
    </header>
  );
}
