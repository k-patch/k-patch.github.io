import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GamePatch } from '../types';
import { Sparkles, ExternalLink, X, Link, ChevronDown } from 'lucide-react';

interface GameCardProps {
  patch: GamePatch;
  onDownload: (id: string, fileName: string) => void;
  isExpanded?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ patch, onDownload, isExpanded = false, onExpand, onClose }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'description' | 'installation' | 'changelog'>('description');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Drag to scroll logic
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX - carouselRef.current.offsetLeft;
    dragScrollLeft.current = carouselRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 2; 
    if (Math.abs(walk) > 5) {
      hasDragged.current = true;
    }
    carouselRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  // Get current tab content
  const currentContent = activeTab === 'description' ? patch.description : (
    activeTab === 'installation' ? (patch.installation || '') : (patch.changelog || '')
  );

  // Reset tab when collapsed, but also check hash if expanded
  useEffect(() => {
    if (!isExpanded) {
      setActiveTab('description');
    } else {
      // If expanded, check if hash matches one of our tabs
      const hash = window.location.hash.replace('#', '');
      if (hash === 'installation' && patch.installation) {
        setActiveTab('installation');
      } else if (hash === 'changelog' && patch.changelog) {
        setActiveTab('changelog');
      } else if (hash === 'description') {
        setActiveTab('description');
      }
    }
  }, [isExpanded, patch.installation, patch.changelog]);

  // Measure content height for smooth transition
  useLayoutEffect(() => {
    if (descriptionRef.current) {
      setContentHeight(descriptionRef.current.scrollHeight);
    }
  }, [patch.description, patch.installation, patch.changelog, activeTab, isExpanded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMainButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (patch.files.length > 1) {
      setIsDropdownOpen(!isDropdownOpen);
    } else if (patch.files.length === 1) {
      onDownload(patch.files[0].url || '', patch.files[0].downloadName || patch.files[0].name);
    }
  };

  const handleFileSelect = (fileName: string) => {
    onDownload(patch.id, fileName);
    setIsDropdownOpen(false);
  };

  const isRecent = (() => {
    const date = new Date(patch.versionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  })();

  const cardRef = useRef<HTMLDivElement>(null);

  const durationMs = contentHeight ? Math.min(Math.max(contentHeight, 300), 800) : 300;
  const transitionDuration = `${durationMs}ms`;

  const collapsedHeightPixels = 78; // Approx 4.9rem
  const showMoreIndicator = !isExpanded && contentHeight !== null && contentHeight > collapsedHeightPixels;

  // Smoothly scroll to the card while it expands (Follow camera effect)
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      let rafId: number;
      const start = performance.now();
      const duration = durationMs + 150; // 약간의 안정화 시간 추가
      
      const step = (now: number) => {
        const elapsed = now - start;
        if (elapsed < duration) {
          const el = cardRef.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            // 화면 상단에서 80px(여백) 띄운 위치를 목표로 부드럽게 추적합니다.
            const diff = rect.top - 80;
            if (Math.abs(diff) > 1) {
              window.scrollBy(0, diff * 0.15);
            }
          }
          rafId = requestAnimationFrame(step);
        }
      };
      
      rafId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafId);
    }
  }, [isExpanded, durationMs]);

  // Tab definitions
  const tabs = [
    { id: 'description', label: '소개' },
    { id: 'installation', label: '설치 방법', hidden: !patch.installation },
    { id: 'changelog', label: '변경 이력', hidden: !patch.changelog },
  ].filter(t => !t.hidden) as { id: typeof activeTab, label: string }[];

  const handleTabClick = (e: React.MouseEvent, tabId: typeof activeTab) => {
    e.stopPropagation();
    setActiveTab(tabId);

    // Update URL hash
    const currentPath = decodeURIComponent(window.location.pathname);
    if (currentPath.includes(patch.slug || '')) {
      window.history.replaceState(null, '', `${currentPath}#${tabId}`);
    }

    if (!isExpanded && onExpand) {
      onExpand();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`flex flex-row gap-6 py-8 border-b border-gray-200 group items-start last:border-0 hover:bg-gray-100 transition-colors duration-200 rounded-lg px-4 relative scroll-mt-12 md:scroll-mt-24 ${isExpanded ? 'bg-gray-100 cursor-default' : 'cursor-pointer'}`}
      style={{
        zIndex: isExpanded ? 50 : 1,
        transition: `background-color 200ms`
      }}
      onClick={onExpand}
    >
      {/* Close Button */}
      {isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {/* Thumbnail */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-[230px] h-[107px] rounded-xl overflow-hidden bg-gray-200 shadow-md relative group-hover:shadow-lg transition-all duration-300">
          {patch.url ? (
            <a
              href={patch.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={patch.imageUrl}
                alt={patch.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </a>
          ) : (
            <img
              src={patch.imageUrl}
              alt={patch.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>

        {/* Sources */}
        {patch.sources && patch.sources.length > 0 && (
          <div className="mt-2 w-[230px]">
            <div className="flex flex-col gap-1">
              {patch.sources.map((source, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <Link className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {source.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col justify-start min-w-0 relative">
        <div className="mb-2 flex items-center justify-between">
          <h3 className={`text-xl md:text-2xl font-bold text-gray-900 transition-colors min-w-0`}>
            {patch.title}
          </h3>

          {/* Tab Navigation (Visible only when multiple tabs exist) */}
          {tabs.length > 1 && (
            <div className="flex items-center gap-1 bg-gray-200/50 p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={(e) => handleTabClick(e, tab.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Frontmatter Images Carousel */}
        {patch.images && patch.images.length > 0 && (
          <div 
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onClickCapture={(e) => {
              if (hasDragged.current) {
                e.stopPropagation();
              }
            }}
            className={`flex gap-3 overflow-x-auto pb-4 mb-4 hide-scrollbar max-w-full cursor-grab active:cursor-grabbing select-none`}
          >
            {patch.images.map((imgUrl, idx) => (
              <div key={idx} className="flex-shrink-0">
                <img
                  src={imgUrl}
                  alt={`Image ${idx + 1}`}
                  draggable={false}
                  className="h-48 w-auto rounded-lg object-cover hover:opacity-90 transition-opacity border border-gray-200 shadow-sm"
                  onClick={(e) => {
                    if (!isExpanded) {
                      return; // Let event bubble up to expand the card
                    }
                    e.stopPropagation();
                    setSelectedImage(imgUrl);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Description/Content Area */}
        <div
          ref={descriptionRef}
          className="text-base text-gray-600 leading-relaxed overflow-hidden ease-in-out prose prose-sm prose-gray max-w-none [&>p]:mb-2 last:[&>p]:mb-0 prose-a:no-underline prose-img:rounded-lg prose-headings:font-bold prose-code:text-primary-600 prose-pre:bg-white prose-pre:text-gray-50 cursor-text"
          style={{
            maxHeight: isExpanded && contentHeight ? `${contentHeight}px` : '4.9rem',
            transitionProperty: 'max-height',
            transitionDuration: transitionDuration,
          }}
        >

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: (props) => (
                <img
                  {...props}
                  className="cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(props.src || null);
                  }}
                />
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-0.5 no-underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )
            }}
          >
            {currentContent}
          </ReactMarkdown>
        </div>

        {/* Show More Indicator */}
        {showMoreIndicator && (
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white group-hover:from-gray-100 to-transparent flex items-end justify-center pointer-events-none rounded-b-lg">
            <ChevronDown className="w-5 h-5 text-gray-400 mb-1 animate-pulse" />
          </div>
        )}
      </div>

      {/* Download Action & Date */}
      <div className="flex-shrink-0 ml-6 flex flex-col items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleMainButtonClick}
            className={`bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-base font-bold py-2.5 px-6 rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center whitespace-nowrap transform ${isDropdownOpen ? 'bg-primary-800 ring-2 ring-primary-300' : ''}`}
          >
            {patch.files.length > 1 ? (
              <>
                <span>파일 선택</span>
                <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                다운로드
              </>
            )}
          </button>

          {/* Dropdown Menu for Multiple Files */}
          {isDropdownOpen && patch.files.length > 1 && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-fade-in-up origin-top-right">
              <div className="py-1">
                {patch.files.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => onDownload(file.url || '', file.downloadName || file.name)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center group transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary-600" title={file.name}>{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md ml-3 whitespace-nowrap">{file.size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center pt-1">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">최근 수정일</span>
          <div className="flex items-center gap-1.5">
            {isRecent && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-sm text-gray-700 font-bold font-mono">{patch.versionDate}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(null);
          }}
        >
          <div className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center">
            <button
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Fullscreen view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div >
  );
};

export default GameCard;