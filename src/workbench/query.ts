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
): Promise<Corpus> => {
  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  const [header, ...rows] = response.split('\n');
  const headerMap: Record<string, number> = {};
  if (!refCorpus.wordsByVerse) {
    refCorpus.wordsByVerse = {} as Record<string, Verse>;
  }

  header.split('\t').forEach((header, idx) => {
    headerMap[header] = idx;
  });

  rows.forEach((row) => {
    const values = row.split('\t');

    let id, wordKey, wordRef: BCVWP, pos, word: Word, verse;

    switch (fileType) {
      case CorpusFileFormat.TSV_TARGET:
        // filter out punctuation in content
        if (punctuationFilter.includes(values[headerMap['text']])) {
          // skip punctuation
          return;
        }

        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['identifier']];
        if (!BCVWP.isValidString(id)) {
          return;
        }
        wordRef = BCVWP.parseFromString(id);
        pos = +id.substring(8, 11); // grab word position
        word = {
          id: id, // standardize n40001001002 to  40001001002
          side,
          corpusId: refCorpus.id,
          text: values[headerMap['text']],
          position: pos,
        };

        wordKey = word.text.toLowerCase();
        if (refCorpus.wordLocation.has(wordKey)) {
          refCorpus.wordLocation.get(wordKey)?.add(wordRef);
        } else {
          refCorpus.wordLocation.set(wordKey, new Set<BCVWP>([wordRef]));
        }
        verse = refCorpus.wordsByVerse[id.substring(0, 8)] || {};
        refCorpus.wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word]),
        };
        refCorpus.words.push(word);
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

        wordRef = BCVWP.parseFromString(id);
        wordKey = word.text.toLowerCase();
        if (refCorpus.wordLocation.has(wordKey)) {
          refCorpus.wordLocation.get(wordKey)?.add(wordRef);
        } else {
          refCorpus.wordLocation.set(wordKey, new Set<BCVWP>([wordRef]));
        }

        verse = refCorpus.wordsByVerse[id.substring(0, 8)] || {};
        refCorpus.wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word]),
        };
        refCorpus.words.push(word);
        break;
    }
  });

  return refCorpus;
};

const putVerseInCorpus = (corpus: Corpus, verse: Verse) => {
  if (!(verse.bcvId.book && verse.bcvId.chapter && verse.bcvId.verse)) {
    return;
  }
  if (!corpus.books) {
    corpus.books = {};
  }
  if (!corpus.books[verse.bcvId.book]) {
    corpus.books[verse.bcvId.book] = {};
  }
  const bookRef = corpus.books[verse.bcvId.book];
  if (!bookRef[verse.bcvId.chapter]) {
    bookRef[verse.bcvId.chapter] = {};
  }
  const chapterRef = bookRef[verse.bcvId.chapter];
  chapterRef[verse.bcvId.verse] = verse;
};

const putVersesInCorpus = (corpus: Corpus) => {
  Object.values(corpus.wordsByVerse).forEach((verse) =>
    putVerseInCorpus(corpus, verse)
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
      wordLocation: new Map<string, Set<BCVWP>>(),
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
    putVersesInCorpus(maculaHebOT);

    // YLT Old Testament
    let wlcYltOt: Corpus = {
      id: 'wlc-ylt',
      name: 'YLT',
      fullName: 'YLT Old Testament',
      language: {
        code: 'en',
        textDirection: 'ltr',
      },
      words: [],
      wordsByVerse: {},
      wordLocation: new Map<string, Set<BCVWP>>(),
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
    putVersesInCorpus(wlcYltOt);

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
      wordLocation: new Map<string, Set<BCVWP>>(),
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
    putVersesInCorpus(sblGnt);

    let na27Ylt: Corpus = {
      id: 'na27-YLT',
      name: 'YLT',
      fullName: "Young's Literal Translation text New Testament",
      language: {
        code: 'eng',
        textDirection: 'ltr',
      },
      words: [],
      wordsByVerse: {},
      wordLocation: new Map<string, Set<BCVWP>>(),
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
    putVersesInCorpus(na27Ylt);

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
