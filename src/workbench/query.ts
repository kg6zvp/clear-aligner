import {Corpus, CorpusFileFormat, Verse, Word} from 'structs';
import BCVWP, {BCVWPField} from "../BCVWP/BCVWPSupport";

// @ts-ignore
import MACULA_SBLGNT from 'tsv/source_macula_greek_SBLGNT.tsv';
// @ts-ignore
import NA27_YLT from "tsv/target_NA27-YLT.tsv";

let isInitialized: boolean = false;

const availableCorpora: Corpus[] = [];

const punctuationFilter = [',', '.', '[', ']', ':', '‘', '’', '—', '?', '!', ';', 'FALSE', '(', ')', 'TRUE',];

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
        pos = +id.substring(8, 11); // grab word position
        word = {
          id: id, // standardize n40001001002 to  40001001002
          corpusId: refCorpus.id,
          text: values[headerMap['text']],
          position: pos,
        } as Word;

        verse = wordsByVerse[id.substring(0, 8)] || {}
        wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: id.substring(0, 8),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word])
        };
        accumulator.push(word);
        break;

      case CorpusFileFormat.TSV_MACULA:
      default:
        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['xml:id']].slice(1);
        pos = +id.substring(8, 11); // grab word position
        word = {
          id: id, // standardize n40001001002 to  40001001002
          corpusId: refCorpus.id,
          text: values[headerMap['text']],
          after: values[headerMap['after']],
          position: pos,
        } as Word;

        verse = wordsByVerse[id.substring(0, 8)] || {}
        wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: id.substring(0, 8),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word])
        };
        accumulator.push(word);
        break;
    }

    return accumulator;
  }, [] as Word[]);

  const bcvIds = Object.keys(wordsByVerse);

  return {
    words: reducedWords,
    wordsByVerse: wordsByVerse
  }
}

export const convertBcvToIdentifier = (bcvwp: BCVWP | null | undefined) => {
  if(!bcvwp) return "";
  return (
    `${bcvwp.book}`.padStart(2, '0') +
    [bcvwp.chapter as number, bcvwp.verse as number]
      .filter(v => v)
      .map((section: number) => {
        return `${section}`.padStart(3, '0');
      })
      .join('')
  );
};

export const getAvailableCorpora = async (): Promise<Corpus[]> => {
  if (!isInitialized) {
    isInitialized = true;

    // SBL GNT
    let sblGnt: Corpus = {
      id: 'sbl-gnt',
      name: 'SBL GNT',
      fullName: 'SBL Greek New Testament',
      language: 'grc',
      words: [],
      primaryVerse: "",
      wordsByVerse: {}
    };

    // @ts-ignore
    const sblWords = await parseTsvByFileType(
      MACULA_SBLGNT,
      sblGnt,
      CorpusFileFormat.TSV_MACULA
    )
    sblGnt = {
      ...sblGnt,
      ...sblWords
    }

    availableCorpora.push(sblGnt);

    let na27Ylt: Corpus = {
      id: 'na27-YLT',
      name: 'NA27 YLT',
      fullName: 'Nestle-Aland 27th Edition YLT text',
      language: 'eng',
      words: [],
      primaryVerse: "",
      wordsByVerse: {}
    };

    // @ts-ignore
    const na27Words = await parseTsvByFileType(
      NA27_YLT,
      na27Ylt,
      CorpusFileFormat.TSV_TARGET
    );
    na27Ylt = {
      ...na27Ylt,
      ...na27Words
    }

    availableCorpora.push(na27Ylt);
  }

  return availableCorpora;
};

export const getAvailableCorporaIds = async (): Promise<string[]> => {
  return (availableCorpora.length ? availableCorpora : (await getAvailableCorpora())).map((corpus) => {
    return corpus.id;
  });
}

export const queryText = async (
  corpusId: string,
  position?: BCVWP|null
): Promise<Corpus|null> => {
  if (!position) return null;
  const corpus = (await getAvailableCorpora()).find((corpus) => {
    return corpus.id === corpusId;
  });

  if (!corpus) {
    throw new Error(`Unable to find requested corpus: ${corpusId}`);
  }

  const bcvId = position.toTruncatedReferenceString(BCVWPField.Verse);
  const queriedData = corpus.words.filter((m) => m.id.startsWith(bcvId));

  return {
    id: corpus?.id ?? '',
    name: corpus?.name ?? '',
    fullName: corpus?.fullName ?? '',
    language: corpus?.language ?? '',
    words: queriedData,
    primaryVerse: bcvId,
    wordsByVerse: corpus.wordsByVerse
  };
}
