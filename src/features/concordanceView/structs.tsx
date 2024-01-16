import { LanguageInfo, Link } from '../../structs';

export interface PivotWord {
  frequency: number;
  pivotWord: string;
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
