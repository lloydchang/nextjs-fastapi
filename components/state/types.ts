// File: components/state/types.ts

export interface Talk {
    title: string;
    description?: string;         // Optional property
    presenter?: string;           // Optional property
    sdg_tags: string[];
    similarity_score?: number;    // Optional property
    url: string;
  }
