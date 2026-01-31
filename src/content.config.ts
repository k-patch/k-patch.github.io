import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const patchesCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/patches" }),
    schema: z.object({
        id: z.string().optional(), // ID might be auto-generated or missing in initial draft
        title: z.string(),
        url: z.string().optional(),
        imageUrl: z.string(),
        versionDate: z.union([z.string(), z.date()]).transform((val) => {
            if (val instanceof Date) {
                return val.toISOString().split('T')[0];
            }
            return val;
        }).optional(), // Date might not be picked yet
        downloadCount: z.number().default(0),
        files: z.array(z.object({
            name: z.string().optional(),
            size: z.string().optional(),
            url: z.string().optional()
        })).optional().default([]), // Files might be empty initially
        sources: z.array(z.object({
            name: z.string(),
            url: z.string()
        })).optional(),
        images: z.array(z.string()).optional()
    })
});

export const collections = {
    'patches': patchesCollection,
};
