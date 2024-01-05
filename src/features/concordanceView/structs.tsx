import BCVWP from '../bcvwp/BCVWPSupport';
import { Link } from '../../structs';

export interface PivotWord {
  frequency: number;
  pivotWord: string;
  alignedWords?: AlignedWord[];
}

export interface AlignedWord {
  id: string;
  frequency: number;
  sourceTextId: string;
  targetTextId: string;
  sourceWordTexts: string[];
  targetWordTexts: string[];
  gloss?: string[] | null;
  alignments?: Link[];
}
