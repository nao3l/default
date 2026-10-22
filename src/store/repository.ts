import { z } from 'zod';
import {
  annotationSchema,
  expressionSchema,
  type Annotation,
  type Expression,
  type ExpressionDraft,
} from '../domain/expression';
import type { Database } from './db';

export const EXPORT_FORMAT = 'gentlemans-phrasebook/v1';

const exportSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  exportedAt: z.iso.datetime(),
  expressions: z.array(expressionSchema.extend({ source: z.literal('user') })),
  annotations: z.array(annotationSchema),
});

export type ExportData = z.infer<typeof exportSchema>;

// 収録データと端末内の登録データを 1 つにまとめる窓口。画面は保存先を知らない。
export class Repository {
  constructor(
    private readonly db: Database,
    private readonly builtin: Expression[],
  ) {}

  async listExpressions(): Promise<Expression[]> {
    const user = await this.db.getAll('userExpressions');
    user.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return [...user, ...this.builtin];
  }

  async getExpression(id: string): Promise<Expression | undefined> {
    return this.builtin.find((e) => e.id === id) ?? (await this.db.get('userExpressions', id));
  }

  async createExpression(draft: ExpressionDraft): Promise<Expression> {
    const now = new Date().toISOString();
    const expression = expressionSchema.parse({
      ...draft,
      id: crypto.randomUUID(),
      source: 'user',
      createdAt: now,
      updatedAt: now,
    });
    await this.db.put('userExpressions', expression);
    return expression;
  }

  async updateExpression(id: string, draft: ExpressionDraft): Promise<Expression> {
    const current = await this.db.get('userExpressions', id);
    if (!current) throw new Error('収録表現は編集できません');
    const expression = expressionSchema.parse({
      ...draft,
      id,
      source: 'user',
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    });
    await this.db.put('userExpressions', expression);
    return expression;
  }

  async deleteExpression(id: string): Promise<void> {
    const tx = this.db.transaction(['userExpressions', 'annotations'], 'readwrite');
    await Promise.all([
      tx.objectStore('userExpressions').delete(id),
      tx.objectStore('annotations').delete(id),
      tx.done,
    ]);
  }

  async listAnnotations(): Promise<Map<string, Annotation>> {
    const all = await this.db.getAll('annotations');
    return new Map(all.map((a) => [a.expressionId, a]));
  }

  async saveAnnotation(
    expressionId: string,
    patch: Partial<Pick<Annotation, 'favorite' | 'note'>>,
  ): Promise<Annotation> {
    const current = await this.db.get('annotations', expressionId);
    const annotation: Annotation = {
      expressionId,
      favorite: patch.favorite ?? current?.favorite ?? false,
      note: patch.note ?? current?.note,
      updatedAt: new Date().toISOString(),
    };
    if (!annotation.favorite && !annotation.note) {
      await this.db.delete('annotations', expressionId);
    } else {
      await this.db.put('annotations', annotation);
    }
    return annotation;
  }

  async exportData(): Promise<ExportData> {
    const [expressions, annotations] = await Promise.all([
      this.db.getAll('userExpressions'),
      this.db.getAll('annotations'),
    ]);
    return {
      format: EXPORT_FORMAT,
      exportedAt: new Date().toISOString(),
      expressions: expressions.map((e) => ({ ...e, source: 'user' as const })),
      annotations,
    };
  }

  // 同じ id は読み込んだ内容で上書きする。戻り値は取り込んだ件数。
  async importData(raw: unknown): Promise<{ expressions: number; annotations: number }> {
    const data = exportSchema.parse(raw);
    const tx = this.db.transaction(['userExpressions', 'annotations'], 'readwrite');
    await Promise.all([
      ...data.expressions.map((e) => tx.objectStore('userExpressions').put(e)),
      ...data.annotations.map((a) => tx.objectStore('annotations').put(a)),
      tx.done,
    ]);
    return { expressions: data.expressions.length, annotations: data.annotations.length };
  }
}
