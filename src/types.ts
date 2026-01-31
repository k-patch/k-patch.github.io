export interface PatchFile {
  name: string;
  size: string;
  url?: string;
  downloadName?: string;
}

export interface GamePatch {
  id: string;
  slug?: string;
  title: string;

  imageUrl: string;
  versionDate: string;
  description: string;
  installation?: string;
  changelog?: string;
  downloadCount: number;
  files: PatchFile[];
  sources?: { name: string; url: string }[];
  images?: string[];
  url?: string;
}

export interface NewPatchForm {
  title: string;

  description: string;
}