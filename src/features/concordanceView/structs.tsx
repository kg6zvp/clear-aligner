import BCVWP from '../bcvwp/BCVWPSupport';
import {LanguageInfo, Link} from '../../structs';

export interface PivotWord {
  frequency: number;
  pivotWord: string;
  languageInfo?: LanguageInfo;
  alignedWords?: AlignedWord[];
}

export interface LocalizedWordEntry {
  text: string;
  languageInfo?: LanguageInfo;
}

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
