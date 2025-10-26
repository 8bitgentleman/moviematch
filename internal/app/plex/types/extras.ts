/// Plex Extras
/// Path: /library/metadata/<metadata-id>/extras

import type { Media, Part } from "/internal/app/plex/types/library_items.ts";

export interface ExtrasResponse {
  size: number;
  Metadata: Extra[];
}

export interface Extra {
  ratingKey: string;
  key: string;
  guid: string;
  type: string;
  title: string;
  summary?: string;
  thumb?: string;
  subtype: string;
  duration?: number;
  addedAt: number;
  updatedAt?: number;
  extraType: number; // 1 = trailer, 2 = behind the scenes, 3 = interviews, etc.
  Media?: Media[];
}
