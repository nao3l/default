import { describe, expect, it } from 'vitest';
import { SCENES } from '../domain/expression';
import { builtinExpressions, parseBuiltin } from './builtin';

describe('収録データ', () => {
  it('すべての場面に日本語と英語の表現がある', () => {
    for (const scene of SCENES) {
      const inScene = builtinExpressions.filter((e) => e.scene === scene);
      expect(
        inScene.some((e) => e.lang === 'ja'),
        `${scene} の日本語`,
      ).toBe(true);
      expect(
        inScene.some((e) => e.lang === 'en'),
        `${scene} の英語`,
      ).toBe(true);
    }
  });

  it('日本語の表現には読みがある', () => {
    const missing = builtinExpressions.filter((e) => e.lang === 'ja' && !e.reading);
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it('同じ表現が二重に収録されていない', () => {
    const texts = builtinExpressions.map((e) => `${e.lang}:${e.text}`);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('ファイル名と場面が一致している', () => {
    const files = import.meta.glob<{ default: { scene: string }[] }>('./expressions/*.json', {
      eager: true,
    });
    for (const [path, mod] of Object.entries(files)) {
      const scene = path.match(/([a-z]+)\.json$/)![1];
      expect(
        mod.default.every((e) => e.scene === scene),
        path,
      ).toBe(true);
    }
  });

  it('必須項目が欠けたデータを拒否する', () => {
    const broken = { './x.json': { default: [{ id: 'builtin-0001', text: '' }] } };
    expect(() => parseBuiltin(broken)).toThrow(/x\.json/);
  });

  it('重複した id を拒否する', () => {
    const entry = {
      id: 'builtin-0001',
      text: 'a',
      lang: 'en',
      scene: 'greeting',
      formality: 1,
      archaic: false,
      examples: [],
      tags: [],
      keywords: [],
    };
    const dup = { './a.json': { default: [entry] }, './b.json': { default: [entry] } };
    expect(() => parseBuiltin(dup)).toThrow(/重複/);
  });
});
