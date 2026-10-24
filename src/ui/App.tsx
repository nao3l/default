import { useEffect } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { reportView } from '../telemetry/accessLog';
import { DetailPage } from './pages/DetailPage';
import { EditPage } from './pages/EditPage';
import { HomePage } from './pages/HomePage';
import { MinePage } from './pages/MinePage';
import { SettingsPage } from './pages/SettingsPage';

const NAV = [
  { to: '/', label: '探す', end: true },
  { to: '/mine', label: '表現帳', end: false },
  { to: '/new', label: '登録', end: false },
  { to: '/settings', label: '設定', end: false },
];

export function App() {
  const { pathname } = useLocation();
  useEffect(() => reportView(pathname), [pathname]);

  return (
    <div className="app">
      <header className="header">
        <h1>紳士の表現帳</h1>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/e/:id" element={<DetailPage />} />
          <Route path="/e/:id/edit" element={<EditPage />} />
          <Route path="/new" element={<EditPage />} />
          <Route path="/mine" element={<MinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<p className="empty">ページが見つかりません。</p>} />
        </Routes>
      </main>
      <nav className="nav" aria-label="メイン">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
