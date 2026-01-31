import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { GamePatch } from '../types';
import { X, ExternalLink, Link, Sparkles } from 'lucide-react';

interface PatchModalProps {
    patch: GamePatch;
    onClose: () => void;
    onDownload: (url: string, fileName: string) => void;
}

const PatchModal: React.FC<PatchModalProps> = ({ patch, onClose, onDownload }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'description' | 'installation' | 'changelog'>('description');

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Close when clicking backdrop
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const isRecent = (() => {
        const date = new Date(patch.versionDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 14;
    })();

    const tabs = [
        { id: 'description', label: '소개' },
        { id: 'installation', label: '설치 방법', hidden: !patch.installation },
        { id: 'changelog', label: '변경 이력', hidden: !patch.changelog },
    ].filter(t => !t.hidden) as { id: typeof activeTab, label: string }[];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 z-10"
                    title="닫기"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Image */}
                <div className="relative h-48 md:h-64 overflow-hidden rounded-t-2xl">
                    <img
                        src={patch.imageUrl}
                        alt={patch.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6">
                        <div className="flex items-center gap-2 mb-2">
                            {isRecent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                                    <Sparkles className="w-3 h-3" />
                                    최근 업데이트
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                            {patch.url ? (
                                <a
                                    href={patch.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline inline-flex items-center gap-2"
                                >
                                    {patch.title}
                                    <ExternalLink className="w-5 h-5 opacity-70" />
                                </a>
                            ) : (
                                patch.title
                            )}
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Date */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium">최근 수정일:</span>
                            <span className="font-mono font-bold text-gray-700">{patch.versionDate}</span>
                        </div>

                        {/* Tabs */}
                        {tabs.length > 1 && (
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === tab.id
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

                    {/* Description / Content */}
                    <div className="prose prose-gray max-w-none mb-6 min-h-[100px]">
                        <ReactMarkdown
                            components={{
                                a: ({ href, children }) => (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-0.5"
                                    >
                                        {children}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )
                            }}
                        >
                            {activeTab === 'description' ? patch.description : (
                                activeTab === 'installation' ? (patch.installation || '') : (patch.changelog || '')
                            )}
                        </ReactMarkdown>
                    </div>

                    {/* Download Section */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">다운로드</h3>
                        <div className="space-y-2">
                            {patch.files.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => onDownload(file.url || '', file.downloadName || file.name)}
                                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-800 group-hover:text-primary-700">{file.name}</span>
                                    </div>
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{file.size}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sources */}
                    {patch.sources && patch.sources.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-bold text-gray-700 mb-2">출처</h3>
                            <div className="flex flex-wrap gap-2">
                                {patch.sources.map((source, idx) => (
                                    <a
                                        key={idx}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        <Link className="w-3.5 h-3.5" />
                                        {source.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatchModal;
