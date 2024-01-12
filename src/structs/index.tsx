import BCVWP, {BCVWPField} from '../features/bcvwp/BCVWPSupport';

export enum SyntaxType {
  // Has syntax data.
  Source = 'source',
  // Mapped to a corpus with syntax data.
  Mapped = 'mapped',
  // Mapped to a corpus that is mapped to a corpus with syntax data.
  MappedSecondary = 'mappedSecondary',
}

export enum CorpusViewType {
  Paragraph = 'paragraph',
  Treedown = 'treedown',
}

export enum TreedownType {
  Source = 'source',
  Mapped = 'mapped',
}

// Linkable sub-unit of corpus
export interface Word {
  id: string;
  corpusId: string;

  text: string;
  // character[s] following the text. i.e. punctuation.
  after?: string;
  position: number;
}

export interface CorpusViewport {
  containerId: string | null;
}

export interface Verse {
  bcvId: BCVWP;
  citation: string; // ${chapter}:${verse}
  words: Word[];
}

export type TextDirection = 'ltr'|'rtl';

export interface LanguageInfo {
  code: string;
  textDirection: TextDirection;
  fontFamily?: string;
}

// A body of text.
export interface Corpus {
  id: string;
  name: string;
  fullName: string;
  language: LanguageInfo;
  words: Word[];
  wordsByVerse: Record<string, Verse>;
  fullText?: string;
  viewType?: CorpusViewType;
  syntax?: SyntaxRoot;
}

export class CorpusContainer {
  id: string;
  corpora: Corpus[];

  constructor() {
    this.id = '';
    this.corpora = [];
  }

  containsCorpus(corpusId: string): boolean {
    return this.corpora.some(corpus => corpus.id === corpusId);
  }

  getCorpusById(corpusId: string): Corpus|undefined {
    return this.corpora.find((corpus) => corpus.id === corpusId);
  }

  corpusAtReference(reference: BCVWP): Corpus|undefined {
    const refString = reference.toTruncatedReferenceString(BCVWPField.Book); // assuming corpora differentiate by book
    return this.corpora.find((corpus) => {
      const keys = Object.keys(corpus.wordsByVerse);
      return !!keys.find(key => key.startsWith(refString));
    });
  }

  languageAtReference(reference: BCVWP): LanguageInfo|undefined {
    return this.corpusAtReference(reference)?.language;
  }

  verseByReference(reference: BCVWP): Verse|undefined {
    const refString = reference.toTruncatedReferenceString(BCVWPField.Verse);
    return this.verseByReferenceString(refString);
  }

  verseByReferenceString(refString: string): Verse|undefined {
    const corpus = this.corpora.find((corpus) => corpus.wordsByVerse[refString]);
    if (!corpus)
      return undefined;
    return corpus.wordsByVerse[refString];
  }

  static fromIdAndCorpora = (id: string, corpora: Corpus[]): CorpusContainer => {
    const container = new CorpusContainer();
    container.id = id;
    container.corpora = corpora;
    return container;
  }
}

export enum CorpusFileFormat {
  TSV_MACULA,
  TSV_TARGET,
}

// An instance of alignment
export interface Link {
  id?: string;
  sources: string[];
  targets: string[];
}

export interface DisplayableLink extends Link {
  sourceContainer: CorpusContainer;
  targetContainer: CorpusContainer;
  sourceWords: string[]; // as text
  targetWords: string[]; // as text
}

// Extension of Link, use in tracking
// state of 'inProgress' links.
export interface InProgressLink extends Link {
  source: string;
  target: string;
}

export type AlignmentSide = 'sources' | 'targets';

export interface AlignmentPolarityBase {
  type: 'primary' | 'secondary';
}

export interface PrimaryAlignmentPolarity extends AlignmentPolarityBase {
  type: 'primary';
  syntaxSide: AlignmentSide;
  nonSyntaxSide: AlignmentSide;
}

export interface SecondaryAlignmentPolarity extends AlignmentPolarityBase {
  type: 'secondary';
  mappedSide: AlignmentSide;
  nonMappedSide: AlignmentSide;
}

export type AlignmentPolarity =
  | PrimaryAlignmentPolarity
  | SecondaryAlignmentPolarity;

export interface Alignment {
  source: string;
  target: string;
  polarity: AlignmentPolarity;
  links: Link[];
}

export interface SyntaxContent {
  elementType: string;
  class?: string;

  n?: string;
  osisId?: string;
  lemma?: string;
  strong?: string;
  gloss?: string;
  text?: string;
  rule?: string;
  role?: string;

  head?: string;
  discontinuous?: string;
  person?: string;
  number?: string;
  gender?: string;
  case?: string;
  tense?: string;
  voice?: string;
  mood?: string;
  articular?: string;
  det?: string;
  type?: string;

  alignedWordIds?: string[];
}

export interface SyntaxNode {
  content: SyntaxContent;
  children: SyntaxNode[];
}

export interface SyntaxRoot extends SyntaxNode {
  _syntaxType: SyntaxType;
}
