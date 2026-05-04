/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Ideas } from './pages/Ideas';
import { Exercises } from './pages/Exercises';
import { Progress } from './pages/Progress';
import { Community } from './pages/Community';
import { Profile } from './pages/Profile';
import { AiMirror } from './pages/AiMirror';
import { WelcomeOnboarding } from './pages/WelcomeOnboarding';
import { Auth } from './pages/Auth';

function AppRoutes() {
  const { hasSeenOnboarding, user, loading } = useAppContext();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!hasSeenOnboarding) {
    return <WelcomeOnboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="ideas" element={<Ideas />} />
            <Route path="exercises" element={<Exercises />} />
            <Route path="progress" element={<Progress />} />
            <Route path="community" element={<Community />} />
            <Route path="ai-mirror" element={<AiMirror />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
