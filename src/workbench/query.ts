import {
  AlignmentSide,
  Corpus,
  CorpusContainer,
  CorpusFileFormat,
  Verse,
  Word,
} from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';

// @ts-ignore
import MACULA_SBLGNT from 'tsv/source_macula_greek_SBLGNT.tsv';
// @ts-ignore
import NA27_YLT from 'tsv/target_NA27-YLT.tsv';
// @ts-ignore
import MACULA_HEBOT_TSV from 'tsv/source_macula_hebrew.tsv';
// @ts-ignore
import WLC_OT_YLT_TSV from 'tsv/target_ot_WLC-YLT.tsv';

let isInitialized: boolean = false;

const availableCorpora: CorpusContainer[] = [];

const punctuationFilter = [
  ',',
  '.',
  '[',
  ']',
  ':',
  '‘',
  '’',
  '—',
  '?',
  '!',
  ';',
  'FALSE',
  '(',
  ')',
  'TRUE',
];

const parseTsvByFileType = async (
  tsv: RequestInfo,
  refCorpus: Corpus,
  side: AlignmentSide,
  fileType: CorpusFileFormat
): Promise<Partial<Corpus>> => {
  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  const [header, ...rows] = response.split('\n');
  const headerMap: Record<string, number> = {};
  const wordsByVerse: Record<string, Verse> = {};

  header.split('\t').forEach((header, idx) => {
    headerMap[header] = idx;
  });

  const reducedWords = rows.reduce((accumulator, row) => {
    const values = row.split('\t');

    let id, pos, word: Word, verse;

    switch (fileType) {
      case CorpusFileFormat.TSV_TARGET:
        // filter out punctuation in content
        if (punctuationFilter.includes(values[headerMap['text']])) {
          // skip punctuation
          return accumulator;
        }

        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['identifier']];
        if (!BCVWP.isValidString(id)) {
          return accumulator;
        }
        pos = +id.substring(8, 11); // grab word position
        word = {
          id: id, // standardize n40001001002 to  40001001002
          side,
          corpusId: refCorpus.id,
          text: values[headerMap['text']],
          position: pos,
        };

        verse = wordsByVerse[id.substring(0, 8)] || {};
        wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word]),
        };
        accumulator.push(word);
        break;

      case CorpusFileFormat.TSV_MACULA:
      default: // grab word position
        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['xml:id']].slice(1);
        pos = +id.substring(8, 11);
        word = {
          id: id, // standardize n40001001002 to  40001001002
          corpusId: refCorpus.id,
          side,
          text: values[headerMap['text']],
          after: values[headerMap['after']],
          position: pos,
        } as Word;

        verse = wordsByVerse[id.substring(0, 8)] || {};
        wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word]),
        };
        accumulator.push(word);
        break;
    }

    return accumulator;
  }, [] as Word[]);
  return {
    words: reducedWords,
    wordsByVerse: wordsByVerse,
  };
};

const putWordInCorpus = (corpus: Corpus, word: Word) => {
  const bcv = BCVWP.parseFromString(word.id);
  if (!(bcv.book && bcv.chapter && bcv.verse && bcv.word)) {
    return;
  }
  if (!corpus.books) {
    corpus.books = {};
  }
  if (!corpus.books[bcv.book]) {
    corpus.books[bcv.book] = {};
  }
  const bookRef = corpus.books[bcv.book];
  if (!bookRef[bcv.chapter]) {
    bookRef[bcv.chapter] = {};
  }
  const chapterRef = bookRef[bcv.chapter];
  if (!chapterRef[bcv.verse]) {
    chapterRef[bcv.verse] = {};
  }
  const verseRef = chapterRef[bcv.verse];
  if (bcv.part && !verseRef[bcv.word]) {
    verseRef[bcv.word] = {};
    const wordRef = verseRef[bcv.word] as { [key: number]: Word };
    wordRef[bcv.part] = word;
  } else {
    verseRef[bcv.word] = word;
  }
};

export const convertBcvToIdentifier = (bcvwp: BCVWP | null | undefined) => {
  if (!bcvwp) return '';
  return (
    `${bcvwp.book}`.padStart(2, '0') +
    [bcvwp.chapter as number, bcvwp.verse as number]
      .filter((v) => v)
      .map((section: number) => {
        return `${section}`.padStart(3, '0');
      })
      .join('')
  );
};

export const getAvailableCorporaContainers = async (): Promise<
  CorpusContainer[]
> => {
  if (!isInitialized) {
    isInitialized = true;
    // Macula Hebrew OT
    let maculaHebOT: Corpus = {
      id: 'wlc-hebot',
      name: 'WLC',
      fullName: 'Macula Hebrew Old Testament',
      language: {
        code: 'heb',
        textDirection: 'rtl',
        fontFamily: 'sbl-hebrew',
      },
      words: [],
      wordsByVerse: {},
      books: {},
    };
    const maculaHebOTWords = await parseTsvByFileType(
      MACULA_HEBOT_TSV,
      maculaHebOT,
      'sources',
      CorpusFileFormat.TSV_MACULA
    );
    maculaHebOT = {
      ...maculaHebOT,
      ...maculaHebOTWords,
    };
    maculaHebOT.words.forEach((word) => putWordInCorpus(maculaHebOT, word));

    // YLT Old Testament
    let wlcYltOt: Corpus = {
      id: 'wlc-ylt',
      name: 'WLC YLT OT',
      fullName: 'WLC YLT Old Testament',
      language: {
        code: 'en',
        textDirection: 'ltr',
      },
      words: [],
      wordsByVerse: {},
      books: {},
    };
    const wlcYltOtWords = await parseTsvByFileType(
      WLC_OT_YLT_TSV,
      wlcYltOt,
      'targets',
      CorpusFileFormat.TSV_TARGET
    );
    wlcYltOt = {
      ...wlcYltOt,
      ...wlcYltOtWords,
    };
    wlcYltOt.words.forEach((word) => putWordInCorpus(wlcYltOt, word));

    // SBL GNT
    let sblGnt: Corpus = {
      id: 'sbl-gnt',
      name: 'SBLGNT',
      fullName: 'SBL Greek New Testament',
      language: {
        code: 'grc',
        textDirection: 'ltr',
      },
      words: [],
      wordsByVerse: {},
      books: {},
    };

    const sblWords = await parseTsvByFileType(
      MACULA_SBLGNT,
      sblGnt,
      'sources',
      CorpusFileFormat.TSV_MACULA
    );
    sblGnt = {
      ...sblGnt,
      ...sblWords,
    };
    sblGnt.words.forEach((word) => putWordInCorpus(sblGnt, word));

    let na27Ylt: Corpus = {
      id: 'na27-YLT',
      name: 'YLT NT',
      fullName: "Young's Literal Translation text New Testament",
      language: {
        code: 'eng',
        textDirection: 'ltr',
      },
      words: [],
      wordsByVerse: {},
      books: {},
    };

    const na27Words = await parseTsvByFileType(
      NA27_YLT,
      na27Ylt,
      'targets',
      CorpusFileFormat.TSV_TARGET
    );
    na27Ylt = {
      ...na27Ylt,
      ...na27Words,
    };
    na27Ylt.words.forEach((word) => putWordInCorpus(na27Ylt, word));

    const sourceContainer = CorpusContainer.fromIdAndCorpora('source', [
      maculaHebOT,
      sblGnt,
    ]);
    const targetContainer = CorpusContainer.fromIdAndCorpora('target', [
      wlcYltOt,
      na27Ylt,
    ]);

    availableCorpora.push(sourceContainer);
    availableCorpora.push(targetContainer);
  }

  return availableCorpora;
};

export const getAvailableCorporaIds = async (): Promise<string[]> => {
  return (
    isInitialized ? availableCorpora : await getAvailableCorporaContainers()
  ).map((corpus) => {
    return corpus.id;
  });
};
