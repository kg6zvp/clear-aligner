import {Corpus, CorpusFileFormat, Word} from 'structs';
import BCVWP, {BCVWPTruncation} from "../BCVWP/BCVWPSupport";

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
) : Promise<Word[]> => {
  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  const [header, ...rows] = response.split('\n');
  const headerMap: Record<string, number> = {};
  header.split('\t').forEach((header, idx) => {
    headerMap[header] = idx;
  });

  return rows.reduce((accumulator, row) => {
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
          corpusId: refCorpus.id,
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
          corpusId: refCorpus.id,
          text: values[headerMap['text']],
          after: values[headerMap['after']],
          position: pos,
        });
        break;
    }

    return accumulator;
  }, [] as Word[]);
}

export const getAvailableCorpora = async (): Promise<Corpus[]> => {
  if (!isInitialized) {
    isInitialized = true;

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
  position?: BCVWP|null
): Promise<Corpus|null> => {
  if (!position) return null;
  const corpus = (await getAvailableCorpora()).find((corpus) => {
    return corpus.id === corpusId;
  });

  if (!corpus) {
    throw new Error(`Unable to find requested corpus: ${corpusId}`);
  }

  const bcvId = position.toTruncatedReferenceString(BCVWPTruncation.Verse);
  const queriedData = corpus.words.filter((m) => m.id.startsWith(bcvId));

  return {
    id: corpus?.id ?? '',
    name: corpus?.name ?? '',
    fullName: corpus?.fullName ?? '',
    language: corpus?.language ?? '',
    words: queriedData,
  };
};
