import { LanguageDTO } from "./language";

export enum AlignmentSide {
  sources,
  targets
}
export interface CorpusDTO {
  id: string; // uuid
  name: string;
  side: string;
  fullName: string;
  fileName: string;
  language: LanguageDTO;
  languageCode: string;
  lastUpdated: number;
}
