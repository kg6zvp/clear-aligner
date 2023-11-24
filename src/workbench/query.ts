import { Corpus, CorpusType } from 'structs';
// @ts-ignore
import MACULA from 'tsv/source_macula-greek-SBLGNT.tsv'

const availableCorpora: Corpus[] = [
  {
    id: 'sbl',
    name: 'SBL GNT',
    fullName: 'SBL Greek New Testament',
    language: 'grc',
    words: [],
    syntax: undefined,
  },

  {
    id: 'leb',
    name: 'LEB',
    fullName: 'Lexham English Bible',
    language: 'eng',
    words: [],
  },
  {
    id: 'nvi',
    name: 'NVI',
    fullName: 'Nueva Versión Internacional',
    language: 'spa',
    words: [],
  },
  {
    id: 'backTrans',
    name: 'BT 1',
    fullName: 'Back Translation 1',
    language: 'eng',
    words: [],
  },
];

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

const convertBcvToIdentifier = (corpusId: string, book: number, chapter: number, verse: number) => {
  const convertedSections = book + [chapter, verse].map((section: number) => {
    const paddedNum = `000${section}`;
    return paddedNum.slice(paddedNum.length - 3, paddedNum.length)
  }).join('');

  switch (corpusId) {
    case CorpusType.SBL:
      return `n${convertedSections}`;
    default:
      return convertedSections;
  }
}

const getTsvFromCorpusId = (corpusId: string) => {
  switch(corpusId) {
    case CorpusType.SBL:
    default:
      return MACULA;
  }
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

  const bcvId = convertBcvToIdentifier(corpusId, book, chapter, verse);
  const maculaData = await parseTsv(getTsvFromCorpusId(corpusId), {"xml:id": "n", "ref": "osisId"});
  const queriedData = maculaData.filter(m => (m.n || "").includes(bcvId));

  if (!corpus) {
    throw new Error(`Unable to find requested corpus: ${corpusId}`);
  }

  const words = queriedData
      .map((textData, index) => {
        let id = '';
        if (corpus.id === CorpusType.SBL) {
          const bookString = String(book).padStart(2, '0');
          const chapterString = String(chapter).padStart(3, '0');
          const verseString = String(verse).padStart(3, '0');
          const positionString = String(index + 1).padStart(3, '0');
          id = `${bookString}${chapterString}${verseString}${positionString}0010`;
        } else {
          id = `${corpusId}_${index}`;
        }

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