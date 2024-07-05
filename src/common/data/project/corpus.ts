import { LanguageDTO } from "./language";
import { WordOrPartDTO } from './wordsOrParts';

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
  words?: WordOrPartDTO[];
}
