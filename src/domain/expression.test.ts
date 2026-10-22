import { describe, expect, it } from 'vitest';
import { citationSchema } from './expression';

describe('citationSchema', () => {
  it('書名だけでも、発行元と URL 付きでも受け付ける', () => {
    expect(citationSchema.safeParse({ title: '敬語の指針' }).success).toBe(true);
    expect(
      citationSchema.safeParse({
        title: '敬語の指針',
        publisher: '文化審議会',
        url: 'https://www.bunka.go.jp/',
      }).success,
    ).toBe(true);
  });

  it('書名のない出典や、http(s) 以外の URL は拒否する', () => {
    expect(citationSchema.safeParse({ title: ' ' }).success).toBe(false);
    expect(citationSchema.safeParse({ title: 'x', url: 'javascript:alert(1)' }).success).toBe(
      false,
    );
  });
});
