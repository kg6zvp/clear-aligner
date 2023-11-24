import {Corpus, CorpusFileFormat} from 'structs';
// @ts-ignore
import MACULA_SBLGNT from 'tsv/source_macula-greek-SBLGNT.tsv'

const isInitialized: boolean = false;

const availableCorpora: Corpus[] = [];

const parseTsv = async (tsv: RequestInfo, fieldConversions: Record<string, string> = {}) => {
  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  const [header, ...rows] = response.split('\n');
  const headerMap: Record<number, string> = {};
  header.split('\t').forEach((header, idx) => {
    headerMap[idx] = fieldConversions[header] || header;
  });

  return rows.map(row => {
    const splitRow = row.split('\t');
    const rowData: Record<string, string> = {};
    splitRow.forEach((val, idx) => {
      const header = headerMap[idx];
      if (!header) return;
      rowData[header] = val;
    });
    return rowData;
  });
}
const parseTsvByFileType = async (tsv: RequestInfo, fileType: CorpusFileFormat) => {
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
  }

  corpus.words = rows.map((row, idx) => {
    const values = row.split('\t');

    switch (fileType) {
      case CorpusFileFormat.TSV_MACULA:
      default:

        const id = values[headerMap['xml:id']];
        const pos = +id.substring(8,11); // grab word position

        return {
          id: id.slice(1), // standardize n40001001002 to  40001001002
          corpusId: '',
          text: values[headerMap['text']],
          after: values[headerMap['after']],
          position: pos
        }
    }
  });

  return corpus;
}

const convertBcvToIdentifier = (book: number, chapter: number, verse: number) => {
  return book + [chapter, verse].map((section: number) => {
    return `${section}`.padStart(3, '0')
  }).join('');
}

export const getAvailableCorpora = async (): Promise<Corpus[]> => {

  if (!isInitialized) {

    await parseTsvByFileType(MACULA_SBLGNT, CorpusFileFormat.TSV_MACULA);

    availableCorpora.push({
      id: 'sbl-gnt',
      name: 'SBL GNT',
      fullName: 'SBL Greek New Testament',
      language: 'grc',
      words: [],
      syntax: undefined,
    })
  }

  return availableCorpora;
}

export const queryText = async (
  corpusId: string,
  book: number,
  chapter: number,
  verse: number
): Promise<Corpus> => {

  const corpus = availableCorpora.find((corpus) => {
    return corpus.id === corpusId;
  });

  if (!corpus) {
    throw new Error(`Unable to find requested corpus: ${corpusId}`);
  }

  const bcvId = convertBcvToIdentifier(book, chapter, verse);
  const maculaData = await parseTsv(getTsvFromCorpusId(corpusId), {"xml:id": "n", "ref": "osisId"});
  const queriedData = maculaData.filter(m => (m.n || "").includes(bcvId));

  const words = queriedData
    .map((textData, index) => {
      const bookString = String(book).padStart(2, '0');
      const chapterString = String(chapter).padStart(3, '0');
      const verseString = String(verse).padStart(3, '0');
      const positionString = String(index + 1).padStart(3, '0');
      const id = `${bookString}${chapterString}${verseString}${positionString}`;

      return {
        id,
        corpusId: corpusId,
        position: index,
        text: textData.text,
      };
    });

  return {
    id: corpus?.id ?? '',
    name: corpus?.name ?? '',
    fullName: corpus?.fullName ?? '',
    language: corpus?.language ?? '',
    words: words,
  };
};
