import {
  Corpus,
  CorpusContainer,
  CorpusFileFormat,
  Verse,
  Word,
} from 'structs';
import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';

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

    let id, pos, word, verse;

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
          corpusId: refCorpus.id,
          text: values[headerMap['text']],
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

      case CorpusFileFormat.TSV_MACULA:
      default: // grab word position
        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['xml:id']].slice(1);
        pos = +id.substring(8, 11);
        word = {
          id: id, // standardize n40001001002 to  40001001002
          corpusId: refCorpus.id,
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
    };
    // @ts-ignore
    const maculaHebOTWords = await parseTsvByFileType(
      MACULA_HEBOT_TSV,
      maculaHebOT,
      CorpusFileFormat.TSV_MACULA
    );
    maculaHebOT = {
      ...maculaHebOT,
      ...maculaHebOTWords,
    };

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
    };
    const wlcYltOtWords = await parseTsvByFileType(
      WLC_OT_YLT_TSV,
      wlcYltOt,
      CorpusFileFormat.TSV_TARGET
    );
    wlcYltOt = {
      ...wlcYltOt,
      ...wlcYltOtWords,
    };

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
    };

    // @ts-ignore
    const sblWords = await parseTsvByFileType(
      MACULA_SBLGNT,
      sblGnt,
      CorpusFileFormat.TSV_MACULA
    );
    sblGnt = {
      ...sblGnt,
      ...sblWords,
    };

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
    };

    // @ts-ignore
    const na27Words = await parseTsvByFileType(
      NA27_YLT,
      na27Ylt,
      CorpusFileFormat.TSV_TARGET
    );
    na27Ylt = {
      ...na27Ylt,
      ...na27Words,
    };

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

export const queryText = async (
  containerId: string,
  position?: BCVWP | null
): Promise<Corpus | null> => {
  if (!position) return null;
  const container = (await getAvailableCorporaContainers()).find(
    (container) => {
      return container.id === containerId;
    }
  );

  if (!container) {
    throw new Error(`Unable to find requested: ${containerId}`);
  }

  const corpus = container.corpusAtReference(position);

  if (!corpus) {
    throw new Error(`Unable to find corpus for reference: ${position}`);
  }

  const bcvId = position.toTruncatedReferenceString(BCVWPField.Verse);
  const queriedData = corpus.words.filter((m) => m.id.startsWith(bcvId));

  return {
    id: corpus?.id ?? '',
    name: corpus?.name ?? '',
    fullName: corpus?.fullName ?? '',
    language: corpus?.language ?? '',
    words: queriedData,
    wordsByVerse: corpus.wordsByVerse,
  };
};
