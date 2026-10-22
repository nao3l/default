import { expect, test } from '@playwright/test';

test('検索から詳細を開き、お気に入りに入れて表現帳で見返せる', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: '表現を検索' }).fill('ありがとう');
  await expect(page.getByRole('link', { name: /痛み入ります/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /I am much obliged/ })).toBeVisible();

  await page.getByRole('link', { name: /I am much obliged/ }).click();
  await expect(page.getByRole('heading', { name: 'I am much obliged.' })).toBeVisible();
  await expect(page.getByText('出典未詳')).toBeVisible();
  await page.getByRole('button', { name: '☆ お気に入り' }).click();
  await expect(page.getByRole('button', { name: '★ お気に入り済み' })).toBeVisible();

  await page.getByRole('link', { name: '表現帳' }).click();
  await expect(page.getByRole('link', { name: /I am much obliged/ })).toBeVisible();
});

test('場面と古風で絞り込める', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '感謝' }).click();
  await page.getByLabel('古風').selectOption('only');
  await expect(page.getByText('1 件')).toBeVisible();
  await expect(page.getByRole('link', { name: /I am much obliged/ })).toBeVisible();
});

test('表現を登録し、再読み込み後も残っている', async ({ page }) => {
  await page.goto('/#/new');
  await page.getByLabel(/^表現/).fill('Much obliged, old chap.');
  await page.getByRole('button', { name: '登録する' }).click();
  await expect(page.getByRole('alert')).toContainText('場面');

  await page.getByLabel(/^場面/).selectOption('gratitude');
  await page.getByRole('button', { name: '登録する' }).click();
  await expect(page.getByRole('heading', { name: 'Much obliged, old chap.' })).toBeVisible();
  await expect(page.getByText('英語', { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole('link', { name: '表現帳' }).click();
  await page.getByRole('tab', { name: '登録した表現' }).click();
  await expect(page.getByRole('link', { name: /Much obliged, old chap/ })).toBeVisible();
});
