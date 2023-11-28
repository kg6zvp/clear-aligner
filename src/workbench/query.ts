import {Corpus, CorpusFileFormat, Word} from 'structs';

// @ts-ignore
import MACULA_SBLGNT from 'tsv/source_macula_greek_SBLGNT.tsv';
// @ts-ignore
import NA27_YLT from "tsv/target_NA27-YLT.tsv";

let isInitialized: boolean = false;

const availableCorpora: Corpus[] = [];

const wordsByVerse = new Map<number, Word[]>();

let parsedTsv = new Map<string, Word[]>();

const punctuationFilter = [',', '.', '[', ']', ':', '‘', '’', '—', '?', '!', ';', 'FALSE', '(', ')', 'TRUE',];

const parseTsvByFileType = async (
  tsv: RequestInfo,
  refCorpus: Corpus,
  fileType: CorpusFileFormat,
  refetch = false
) : Promise<Word[]> => {
  if(!refetch && !!(parsedTsv.get(refCorpus.id) || []).length) {
    return parsedTsv.get(refCorpus.id) || [];
  }

  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  const [header, ...rows] = response.split('\n');
  const headerMap: Record<string, number> = {};
  header.split('\t').forEach((header, idx) => {
    headerMap[header] = idx;
  });

  const reducedRows = rows.reduce((accumulator, row) => {
    const values = row.split('\t');

    let id, pos, word;

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

        wordsByVerse.set(+id.substring(0, 8), (wordsByVerse.get(+id.substring(0, 8)) || []).concat([word]));
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

        wordsByVerse.set(+id.substring(0, 8), (wordsByVerse.get(+id.substring(0, 8)) || []).concat([word]));
        accumulator.push(word);
        break;
    }
    return accumulator.sort((a,b) => a.position + b.position);
  }, [] as Word[]);

  parsedTsv.set(refCorpus.id, reducedRows);

  return reducedRows;
}

export const convertBcvToIdentifier = (
  book: number,
  chapter: number,
  verse: number
) => {
  return (
    `${book}`.padStart(2, '0') +
    [chapter, verse]
      .map((section: number) => {
        return `${section}`.padStart(3, '0');
      })
      .join('')
  );
};

export const getAvailableCorpora = async (): Promise<Corpus[]> => {
  if (!isInitialized) {
    // SBL GNT
    const sblGnt = {
      id: 'sbl-gnt',
      name: 'SBL GNT',
      fullName: 'SBL Greek New Testament',
      language: 'grc',
      words: []
    };

    // @ts-ignore
    sblGnt.words = await parseTsvByFileType(
      MACULA_SBLGNT,
      sblGnt,
      CorpusFileFormat.TSV_MACULA
    );

    availableCorpora.push(sblGnt);

    const na27Ylt = {
      id: 'na27-YLT',
      name: 'NA27 YLT',
      fullName: 'Nestle-Aland 27th Edition YLT text',
      language: 'eng',
      words: []
    };

    // @ts-ignore
    na27Ylt.words = await parseTsvByFileType(
      NA27_YLT,
      na27Ylt,
      CorpusFileFormat.TSV_TARGET
    );

    availableCorpora.push(na27Ylt);

    isInitialized = true;
  }
  return availableCorpora;
};

export const getAvailableCorporaIds = async (): Promise<string[]> => {
  return (await getAvailableCorpora()).map((corpus) => {
    return corpus.id;
  });
}

export const getCorpusById = async (corpusId: string) => {
  const corpus = (await getAvailableCorpora()).find((corpus) => {
    return corpus.id === corpusId;
  });

  if (!corpus) {
    throw new Error(`Unable to find requested corpus: ${corpusId}`);
  }

  return corpus;
}


export const queryText = async (
  corpusId: string,
  book: number,
  chapter: number,
  verse: number
): Promise<Corpus> => {
  console.log("querying text...")
  const corpus = await getCorpusById(corpusId);
  const bcvId = convertBcvToIdentifier(book, chapter, verse);
  const queriedData = corpus.words.filter((m) => m.id.startsWith(bcvId));

  return {
    id: corpus?.id ?? '',
    name: corpus?.name ?? '',
    fullName: corpus?.fullName ?? '',
    language: corpus?.language ?? '',
    words: queriedData,
  };
};

export const getVerseByBcvOffset = (bcvId: string, offset: number): Word[] => {
  const bcvIdx = Array.from(wordsByVerse.keys()).indexOf(+bcvId);
  const offsetIdx = bcvIdx + offset;
  if(offsetIdx > Array.from(wordsByVerse.keys()).length || offsetIdx < 0) {
    return [];
  }
  const verseKey = Array.from(wordsByVerse.keys()).find((_, idx) => idx === offsetIdx) || 0;
  const wordsInVerse = wordsByVerse.get(verseKey);
  return wordsInVerse || [];
}
