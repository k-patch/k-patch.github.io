import fs from 'node:fs';
import path from 'node:path';

export function getFileSize(filePath: string): string {
    try {
        // Remove query params if any
        const cleanPath = filePath.split('?')[0];

        // Convert URL path (e.g., /uploads/file.zip) to file system path (public/uploads/file.zip)
        // Adjust if necessary depending on where 'public' is relative to CWD
        const actualPath = path.join(process.cwd(), 'public', cleanPath);

        if (!fs.existsSync(actualPath)) {
            return '';
        }

        const stats = fs.statSync(actualPath);
        const bytes = stats.size;

        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    } catch (error) {
        // console.error(`Error reading file size for ${filePath}:`, error);
        return '';
    }
}

export function getFileNameFromUrl(url: string): string {
    if (!url) return '';
    const cleanUrl = url.split('?')[0];
    return path.basename(cleanUrl);
}
