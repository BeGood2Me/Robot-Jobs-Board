'use client';

import { useEffect, useRef, useState } from 'react';

const LINE_ONE = 'Robotics hiring is scattered across a dozen ATS boards.';
const LINE_TWO = 'Robot Jobs Board pulls those jobs into one searchable map.';

function RevealLine({ text }: { text: string }) {
  const words = text.split(' ');
  const ref = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        let i = 0;
        const timer = window.setInterval(() => {
          i += 1;
          setActive(i);
          if (i >= words.length) window.clearInterval(timer);
        }, 80);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [words.length]);

  return (
    <p ref={ref} className="max-w-[680px] text-4xl font-semibold md:text-5xl">
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="mr-3 inline-block transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ opacity: index < active ? 1 : 0.28 }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}

export function TaglineReveal() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <RevealLine text={LINE_ONE} />
        <RevealLine text={LINE_TWO} />
      </div>
    </section>
  );
}
