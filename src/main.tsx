import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { builtinExpressions } from './data/builtin';
import { openDatabase } from './store/db';
import { Repository } from './store/repository';
import { AppProvider } from './ui/AppContext';
import { App } from './ui/App';
import { applyTheme, loadTheme } from './ui/theme';
import './styles/app.css';

applyTheme(loadTheme());

const repository = new Repository(await openDatabase(), builtinExpressions);

// GitHub Pages では深い URL を直接開けないため、ハッシュ形式のルーティングを使う
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppProvider repository={repository}>
        <App />
      </AppProvider>
    </HashRouter>
  </StrictMode>,
);
