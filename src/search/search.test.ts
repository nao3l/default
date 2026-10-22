import { describe, expect, it } from 'vitest';
import type { Annotation, Expression } from '../domain/expression';
import { EMPTY_FILTERS, normalize, pickOfTheDay, search } from './search';

const base = {
  source: 'builtin' as const,
  formality: 2 as const,
  archaic: false,
  examples: [],
  tags: [],
  keywords: [],
};

const items: Expression[] = [
  {
    ...base,
    id: 'a',
    text: '痛み入ります',
    reading: 'いたみいります',
    lang: 'ja',
    scene: 'gratitude',
    keywords: ['ありがとう'],
  },
  {
    ...base,
    id: 'b',
    text: 'I am much obliged.',
    lang: 'en',
    scene: 'gratitude',
    archaic: true,
    keywords: ['ありがとう', 'thanks'],
  },
  { ...base, id: 'c', text: 'ご自愛ください', lang: 'ja', scene: 'care', formality: 1 },
  {
    ...base,
    id: 'u',
    source: 'user',
    text: 'ありがとう存じます',
    lang: 'ja',
    scene: 'gratitude',
    formality: 3,
    createdAt: '2026-10-22T00:00:00.000Z',
  },
];
const none = new Map<string, Annotation>();
const ids = (list: Expression[]) => list.map((e) => e.id);

describe('normalize', () => {
  it('カタカナ・全角・大文字の違いを吸収する', () => {
    expect(normalize('アリガトウ')).toBe(normalize('ありがとう'));
    expect(normalize('ＯＢＬＩＧＥＤ')).toBe('obliged');
  });
});

describe('search', () => {
  it('言い換え語で、表現そのものに含まれない言葉でも引ける', () => {
    expect(ids(search(items, none, { ...EMPTY_FILTERS, query: 'ありがとう' }))).toEqual([
      'u',
      'a',
      'b',
    ]);
  });

  it('読み仮名やカタカナでも引ける', () => {
    expect(ids(search(items, none, { ...EMPTY_FILTERS, query: 'イタミ' }))).toEqual(['a']);
  });

  it('複数の語はすべて含むものに絞る', () => {
    expect(ids(search(items, none, { ...EMPTY_FILTERS, query: 'ありがとう thanks' }))).toEqual([
      'b',
    ]);
  });

  it('場面・言語・古風で絞り込める', () => {
    expect(ids(search(items, none, { ...EMPTY_FILTERS, scene: 'care' }))).toEqual(['c']);
    expect(ids(search(items, none, { ...EMPTY_FILTERS, lang: 'en' }))).toEqual(['b']);
    expect(ids(search(items, none, { ...EMPTY_FILTERS, archaic: 'only' }))).toEqual(['b']);
    expect(ids(search(items, none, { ...EMPTY_FILTERS, archaic: 'exclude' }))).not.toContain('b');
  });

  it('自分の登録とお気に入りで絞り込める', () => {
    const fav = new Map<string, Annotation>([
      ['c', { expressionId: 'c', favorite: true, updatedAt: '2026-10-22T00:00:00.000Z' }],
    ]);
    expect(ids(search(items, fav, { ...EMPTY_FILTERS, onlyUser: true }))).toEqual(['u']);
    expect(ids(search(items, fav, { ...EMPTY_FILTERS, onlyFavorites: true }))).toEqual(['c']);
  });

  it('格式の低い順に並べられる', () => {
    expect(ids(search(items, none, EMPTY_FILTERS, 'formality'))).toEqual(['c', 'a', 'b', 'u']);
  });
});

describe('pickOfTheDay', () => {
  it('同じ日は同じ表現を返す', () => {
    const day = new Date(2026, 9, 22, 9);
    expect(pickOfTheDay(items, day)).toBe(pickOfTheDay(items, new Date(2026, 9, 22, 21)));
  });

  it('空なら undefined', () => {
    expect(pickOfTheDay([], new Date())).toBeUndefined();
  });
});
