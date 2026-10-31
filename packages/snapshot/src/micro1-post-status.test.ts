import { describe, expect, it } from 'vitest';
import {
  isMicro1JobStatusOpen,
  parseMicro1JobStatusFromMarkup,
} from './micro1-post-status';

describe('parseMicro1JobStatusFromMarkup', () => {
  it('reads escaped job_status from micro1 HTML payload', () => {
    const snippet =
      '\\"job_description_url\\":null,\\"job_status\\":\\"open\\",\\"create_datetime\\":\\"2026-10-27';
    expect(parseMicro1JobStatusFromMarkup(snippet)).toBe('open');
  });

  it('reads plain JSON job_status', () => {
    expect(parseMicro1JobStatusFromMarkup('"job_status":"closed"')).toBe('closed');
  });
});

describe('isMicro1JobStatusOpen', () => {
  it('treats only open as open', () => {
    expect(isMicro1JobStatusOpen('open')).toBe(true);
    expect(isMicro1JobStatusOpen('closed')).toBe(false);
    expect(isMicro1JobStatusOpen('filled')).toBe(false);
    expect(isMicro1JobStatusOpen('not_found')).toBe(false);
  });

  it('fail-open when status unknown', () => {
    expect(isMicro1JobStatusOpen(null)).toBe(false);
  });
});
