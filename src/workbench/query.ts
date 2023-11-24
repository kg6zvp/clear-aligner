import {Corpus, CorpusFileFormat, Word} from 'structs';

// @ts-ignore
import MACULA_SBLGNT from 'tsv/source_macula_greek_SBLGNT.tsv';
// @ts-ignore
import NA27_YLT from "tsv/target_NA27-YLT.tsv";

let isInitialized: boolean = false;

const availableCorpora: Corpus[] = [];

const parseTsvByFileType = async (
  tsv: RequestInfo,
  fileType: CorpusFileFormat
) => {
  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  const [header, ...rows] = response.split('\n');
  const headerMap: Record<string, number> = {};
  header.split('\t').forEach((header, idx) => {
    headerMap[header] = idx;
  });

  const corpus: Corpus = {
    id: '',
    name: '',
    fullName: '',
    language: '',
    words: [],
  };

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

  corpus.words = rows.reduce((accumulator, row) => {
    const values = row.split('\t');

    let id, pos;

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

        accumulator.push({
          id: id, // standardize n40001001002 to  40001001002
          corpusId: '',
          text: values[headerMap['text']],
          position: pos,
        });
        break;

      case CorpusFileFormat.TSV_MACULA:
      default:
        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['xml:id']].slice(1);
        pos = +id.substring(8, 11); // grab word position

        accumulator.push({
          id: id, // standardize n40001001002 to  40001001002
          corpusId: '',
          text: values[headerMap['text']],
          after: values[headerMap['after']],
          position: pos,
        });
        break;
    }

    return accumulator;
  }, [] as Word[]);

  return corpus;
}

const convertBcvToIdentifier = (
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
    const sblGnt = await parseTsvByFileType(
      MACULA_SBLGNT,
      // source_macula_greek_SBLGNT,
      CorpusFileFormat.TSV_MACULA
    );
    // doing this instead of the spread operator as not to copy the full words list again
    sblGnt.id = 'sbl-gnt';
    sblGnt.name = 'SBL GNT';
    sblGnt.fullName = 'SBL Greek New Testament';
    sblGnt.language = 'grc';

    availableCorpora.push(sblGnt);

    //
    const na27Ylt = await parseTsvByFileType(
      NA27_YLT,
      CorpusFileFormat.TSV_TARGET
    );
    na27Ylt.id = 'na27-YLT';
    na27Ylt.name = 'NA27 YLT';
    na27Ylt.fullName = 'Nestle-Aland 27th Edition YLT text';
    na27Ylt.language = 'eng';

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

export const queryText = async (
  corpusId: string,
  book: number,
  chapter: number,
  verse: number
): Promise<Corpus> => {
  const corpus = (await getAvailableCorpora()).find((corpus) => {
    return corpus.id === corpusId;
  });

  if (!corpus) {
    throw new Error(`Unable to find requested corpus: ${corpusId}`);
  }

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
