import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full py-12 mt-auto">
            <div className="max-w-5xl mx-auto px-6">
                <div className="border-t border-gray-100 pt-8 flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">
                            K-Patch
                        </span>
                    </div>
                    <p className="text-gray-400 text-xs font-light tracking-widest uppercase">
                        © {new Date().getFullYear()} K-Patch. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
