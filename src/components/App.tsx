import React, { useState, useEffect, useCallback } from 'react';
import GameCard from './GameCard';
import { GamePatch } from '../types';

interface AppProps {
  initialPatches?: GamePatch[];
  initialOpenSlug?: string; // For SEO pages - auto-expand card
}

const App: React.FC<AppProps> = ({ initialPatches = [], initialOpenSlug }) => {
  const [patches] = useState<GamePatch[]>(initialPatches);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Handle initial open from SEO page - auto expand the card
  useEffect(() => {
    if (initialOpenSlug) {
      const patch = patches.find(p => p.slug === initialOpenSlug);
      if (patch) {
        setExpandedCardId(patch.id);
      }
    }
  }, [initialOpenSlug, patches]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/\/patches\/([^/]+)/);
      if (match) {
        const slug = decodeURIComponent(match[1]);
        const patch = patches.find(p => p.slug === slug);
        if (patch) {
          setExpandedCardId(patch.id);
        }
      } else {
        setExpandedCardId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [patches]);

  // Expand card and update URL
  const handleExpand = useCallback((patch: GamePatch) => {
    // Only update if not already on this patch to avoid history pollution
    const targetUrl = `/patches/${patch.slug}`;
    const currentPath = decodeURIComponent(window.location.pathname);
    if (patch.slug && currentPath !== targetUrl) {
      setExpandedCardId(patch.id);
      window.history.pushState({ slug: patch.slug }, '', targetUrl);
    } else if (!patch.slug) {
      setExpandedCardId(patch.id);
    }
  }, []);

  // Close card and restore URL
  const handleClose = useCallback(() => {
    setExpandedCardId(null);
    window.history.replaceState({}, '', '/');
  }, []);

  const handleDownload = (url: string, fileName: string) => {
    if (url && url !== '#' && url.trim() !== '') {
      const link = document.createElement('a');
      link.href = url;
      if (url.startsWith('http')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else {
        link.download = fileName;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`'${fileName}' 파일이 아직 준비되지 않았습니다.`);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 font-sans flex flex-col items-center pb-16 md:pb-24">
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 w-full my-auto py-12 md:py-20">
        <div className="flex flex-col">
          {patches.map(patch => (
            <GameCard
              key={patch.id}
              patch={patch}
              onDownload={handleDownload}
              isExpanded={expandedCardId === patch.id}
              onExpand={() => handleExpand(patch)}
              onClose={handleClose}
            />
          ))}
        </div>

        {patches.length === 0 && (
          <div className="py-24 text-center">
            <div className="text-gray-400 mb-3 text-5xl">📂</div>
            <div className="text-gray-800 font-bold mb-2 text-xl">등록된 패치가 없습니다.</div>
            <p className="text-base text-gray-500">우측 하단 버튼을 눌러 등록해주세요.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;