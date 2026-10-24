import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Expression } from '../../domain/expression';
import type { Repository } from '../../store/repository';
import { AppProvider } from '../AppContext';
import { HomePage } from './HomePage';

const expression: Expression = {
  id: 'builtin-0001',
  source: 'builtin',
  text: 'I am much obliged.',
  lang: 'en',
  scene: 'gratitude',
  formality: 2,
  archaic: true,
  examples: [],
  tags: [],
  keywords: [],
};

const repository = {
  listExpressions: async () => [expression],
  listAnnotations: async () => new Map(),
} as unknown as Repository;

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

describe('HomePage の絞り込み', () => {
  it('再描画の前に続けて操作しても、先の条件が消えない', async () => {
    render(
      <MemoryRouter>
        <AppProvider repository={repository}>
          <HomePage />
          <Search />
        </AppProvider>
      </MemoryRouter>,
    );
    await screen.findByText('1 件');

    // 同じ描画のハンドラを 2 回続けて呼ぶ（遅い端末で起きる状況）
    const chip = screen.getByRole('button', { name: '感謝' });
    const archaic = screen.getByLabelText('古風');
    act(() => {
      fireEvent.click(chip);
      fireEvent.change(archaic, { target: { value: 'only' } });
    });

    const search = new URLSearchParams(screen.getByTestId('search').textContent ?? '');
    expect(search.get('scene')).toBe('gratitude');
    expect(search.get('archaic')).toBe('only');
  });
});
