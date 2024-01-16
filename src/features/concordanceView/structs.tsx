import { LanguageInfo, Link } from '../../structs';

/**
 * represents rows displayed in the pivot word table in the concordance view
 */
export interface PivotWord {
  frequency: number; // number of times this pivot word appears in the text
  normalizedText: string; // normalized text of the pivot word being represented
  languageInfo?: LanguageInfo;
  alignedWords?: AlignedWord[];
}

/**
 * text with corresponding language information for display
 */
export interface LocalizedWordEntry {
  text: string;
  languageInfo?: LanguageInfo;
}

/**
 * Represents the data entries in the aligned words table
 */
export interface AlignedWord {
  id: string;
  frequency: number;
  sourceTextId: string;
  targetTextId: string;
  sourceWordTexts: LocalizedWordEntry[];
  targetWordTexts: LocalizedWordEntry[];
  gloss?: string[] | null;
  alignments?: Link[];
}
