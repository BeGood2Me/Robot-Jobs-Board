import { describe, expect, it } from 'vitest';
import { decodeJobHtml, htmlToPlain } from './normalize';

describe('decodeJobHtml', () => {
  it('turns Greenhouse escaped markup into real HTML', () => {
    const html = decodeJobHtml(
      '&lt;p&gt;&lt;strong&gt;About the Role&lt;/strong&gt;&lt;/p&gt;&lt;p&gt;Build the next humanoid.&lt;/p&gt;',
    );
    expect(html).toContain('<strong>About the Role</strong>');
    expect(htmlToPlain(html)).toContain('Build the next humanoid.');
  });

  it('leaves already-decoded HTML alone', () => {
    const html = '<p>Own whole body control software in C++.</p>';
    expect(decodeJobHtml(html)).toBe(html);
  });
});
