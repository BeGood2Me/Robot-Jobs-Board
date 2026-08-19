import { describe, expect, it } from 'vitest';
import { parseLocation } from './normalize';
import { isAllowedJobLocation, shouldIngestJob } from './region';

describe('region filter', () => {
  it('keeps United States, UK, European, Canadian, and Australian locations', () => {
    expect(isAllowedJobLocation(parseLocation('San Jose, CA'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('London, United Kingdom'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Barcelona, Catalonia'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Zurich, Switzerland'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Wasquehal, France'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Toronto, ON'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Vancouver, BC'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Sydney, NSW'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Melbourne, Australia'))).toBe(true);
  });

  it('drops jobs outside the allowed countries', () => {
    expect(isAllowedJobLocation(parseLocation('Mexico City, Mexico'))).toBe(false);
    expect(isAllowedJobLocation(parseLocation('Sao Paulo, Brazil'))).toBe(false);
    expect(isAllowedJobLocation(parseLocation('Hyderabad, India'))).toBe(false);
    expect(isAllowedJobLocation(parseLocation('Tokyo, Japan'))).toBe(false);
    expect(isAllowedJobLocation(parseLocation('Remote (India)'))).toBe(false);
  });

  it('keeps remote roles that name an allowed country', () => {
    expect(isAllowedJobLocation(parseLocation('Remote, United States'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Remote, UK'))).toBe(true);
  });

  it('skips generic resume inboxes', () => {
    expect(
      shouldIngestJob({
        title: 'General Resume Submittal',
        ...parseLocation('United States'),
      }),
    ).toBe(false);
  });

  it('treats Canadian and Australian place names as those countries', () => {
    expect(parseLocation('Toronto, ON').country).toBe('Canada');
    expect(parseLocation('Vancouver, CA').country).toBe('Canada');
    expect(parseLocation('Waterloo, Ontario').country).toBe('Canada');
    expect(parseLocation('Sydney, NSW').country).toBe('Australia');
    expect(parseLocation('Melbourne, Victoria').country).toBe('Australia');
    expect(parseLocation('Toronto, Canada').country).toBe('Canada');
    expect(parseLocation('Toronto, ON, Canada').country).toBe('Canada');
    expect(parseLocation('Toronto, ON, CA').country).toBe('Canada');
    expect(parseLocation('Darwin, NT').country).toBe('Australia');
    expect(parseLocation('Yellowknife, NT').country).toBe('Canada');
    expect(isAllowedJobLocation(parseLocation('Remote, Canada'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Remote, Australia'))).toBe(true);
  });

  it('treats full US state names as United States', () => {
    expect(parseLocation('Columbus, Ohio').country).toBe('United States');
    expect(parseLocation('Mountain View, California (HQ)').country).toBe('United States');
    expect(parseLocation('California - Santa Clara').country).toBe('United States');
    expect(isAllowedJobLocation(parseLocation('Minneapolis, Minnesota'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('San Francisco'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('NYC | SF'))).toBe(true);
    expect(isAllowedJobLocation(parseLocation('Fremont'))).toBe(true);
  });
});
