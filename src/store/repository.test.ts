import { beforeEach, describe, expect, it } from 'vitest';
import type { Expression, ExpressionDraft } from '../domain/expression';
import { openDatabase } from './db';
import { Repository } from './repository';

const builtin: Expression = {
  id: 'builtin-0001',
  source: 'builtin',
  text: '痛み入ります',
  lang: 'ja',
  scene: 'gratitude',
  formality: 2,
  archaic: false,
  examples: [],
  tags: [],
  keywords: [],
};

const draft: ExpressionDraft = {
  text: 'I am much obliged.',
  lang: 'en',
  scene: 'gratitude',
  formality: 2,
  archaic: true,
  examples: [],
  tags: [],
  keywords: ['thanks'],
};

let repo: Repository;
let dbIndex = 0;

beforeEach(async () => {
  repo = new Repository(await openDatabase(`test-${dbIndex++}`), [builtin]);
});

describe('Repository', () => {
  it('登録した表現は収録表現より前に並ぶ', async () => {
    const created = await repo.createExpression(draft);
    expect(created.source).toBe('user');
    expect((await repo.listExpressions()).map((e) => e.id)).toEqual([created.id, builtin.id]);
  });

  it('登録した表現を編集・削除できる', async () => {
    const created = await repo.createExpression(draft);
    const updated = await repo.updateExpression(created.id, { ...draft, text: 'Much obliged.' });
    expect(updated.text).toBe('Much obliged.');
    expect(updated.createdAt).toBe(created.createdAt);

    await repo.saveAnnotation(created.id, { favorite: true });
    await repo.deleteExpression(created.id);
    expect(await repo.getExpression(created.id)).toBeUndefined();
    expect((await repo.listAnnotations()).has(created.id)).toBe(false);
  });

  it('収録表現は編集できない', async () => {
    await expect(repo.updateExpression(builtin.id, draft)).rejects.toThrow();
  });

  it('収録表現にお気に入りとメモを付けられ、両方外すと消える', async () => {
    await repo.saveAnnotation(builtin.id, { favorite: true });
    await repo.saveAnnotation(builtin.id, { note: '会食で使った' });
    expect((await repo.listAnnotations()).get(builtin.id)).toMatchObject({
      favorite: true,
      note: '会食で使った',
    });

    await repo.saveAnnotation(builtin.id, { favorite: false, note: '' });
    expect((await repo.listAnnotations()).size).toBe(0);
  });

  it('書き出した内容を別の端末で読み込める', async () => {
    const created = await repo.createExpression(draft);
    await repo.saveAnnotation(builtin.id, { favorite: true });
    const exported = JSON.parse(JSON.stringify(await repo.exportData()));

    const other = new Repository(await openDatabase(`test-${dbIndex++}`), [builtin]);
    expect(await other.importData(exported)).toEqual({ expressions: 1, annotations: 1 });
    expect(await other.getExpression(created.id)).toMatchObject({ text: draft.text });
    expect((await other.listAnnotations()).get(builtin.id)?.favorite).toBe(true);
  });

  it('形式の違うファイルは読み込まない', async () => {
    await expect(repo.importData({ hello: 'world' })).rejects.toThrow();
  });
});
