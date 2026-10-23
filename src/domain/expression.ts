import { z } from 'zod';

export const SCENES = [
  'greeting',
  'gratitude',
  'apology',
  'praise',
  'request',
  'decline',
  'care',
  'celebration',
  'condolence',
  'humility',
  'farewell',
  'vocabulary',
] as const;

export const SCENE_LABELS: Record<Scene, string> = {
  greeting: '挨拶',
  gratitude: '感謝',
  apology: 'お詫び',
  praise: '称賛',
  request: '依頼',
  decline: 'お断り',
  care: '労い・気遣い',
  celebration: 'お祝い',
  condolence: 'お悔やみ',
  humility: '謙遜',
  farewell: '別れ',
  vocabulary: '気品ある語彙',
};

export const FORMALITY_LABELS: Record<Formality, string> = {
  1: '品のよい日常',
  2: '改まった場',
  3: '儀礼・文語',
};

export const LANGS = ['ja', 'en', 'fr', 'de', 'it', 'es'] as const;

export const LANG_LABELS: Record<Lang, string> = {
  ja: '日本語',
  en: '英語',
  fr: 'フランス語',
  de: 'ドイツ語',
  it: 'イタリア語',
  es: 'スペイン語',
};

export const sceneSchema = z.enum(SCENES);
export const formalitySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const langSchema = z.enum(LANGS);

const nonEmpty = z.string().trim().min(1);

// 出典。公的機関や辞書出版社など、信頼できる発行元を優先する。無い場合は項目ごと省き「出典未詳」と表示する
export const citationSchema = z.object({
  title: nonEmpty, // 例：デジタル大辞泉「痛み入る」
  publisher: nonEmpty.optional(), // 例：小学館
  url: z.url({ protocol: /^https?$/ }).optional(),
});

export const expressionSchema = z.object({
  id: nonEmpty,
  source: z.enum(['builtin', 'user']),
  text: nonEmpty,
  reading: nonEmpty.optional(),
  lang: langSchema,
  scene: sceneSchema,
  formality: formalitySchema,
  archaic: z.boolean(),
  meaning: nonEmpty.optional(),
  usage: nonEmpty.optional(),
  examples: z.array(nonEmpty),
  tags: z.array(nonEmpty),
  keywords: z.array(nonEmpty),
  citation: citationSchema.optional(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
});

// 収録データの JSON には source を書かない（読み込み時に付与する）
export const builtinEntrySchema = expressionSchema
  .omit({ source: true, createdAt: true, updatedAt: true })
  .extend({ id: z.string().regex(/^builtin-\d{4}$/) });

export const annotationSchema = z.object({
  expressionId: nonEmpty,
  favorite: z.boolean(),
  note: z.string().optional(),
  updatedAt: z.iso.datetime(),
});

export type Scene = z.infer<typeof sceneSchema>;
export type Formality = z.infer<typeof formalitySchema>;
export type Lang = z.infer<typeof langSchema>;
export type Expression = z.infer<typeof expressionSchema>;
export type BuiltinEntry = z.infer<typeof builtinEntrySchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type Citation = z.infer<typeof citationSchema>;

// 登録フォームから受け取る項目（id や日時はリポジトリ層が付ける）
export type ExpressionDraft = Omit<Expression, 'id' | 'source' | 'createdAt' | 'updatedAt'>;
