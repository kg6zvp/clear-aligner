import React, { ReactElement } from 'react';

import {Corpus, SyntaxType, SyntaxRoot, CorpusType} from 'structs';

import EditorWrapper from 'features/editor';

import fetchSyntaxData from 'workbench/fetchSyntaxData';

import { queryText } from 'workbench/query';
import books from 'workbench/books';

import placeholderTreedown from 'features/treedown/treedown.json';

interface WorkbenchProps {}

const documentTitle = '🌲⬇️';

const getBookNumber = (bookName: string) => {
  const bookDoc = books.find(
    (bookItem) => bookItem.OSIS.toLowerCase() === bookName.toLowerCase()
  );
  if (bookDoc) {
    return bookDoc.BookNumber;
  }
};
const getRefParam = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
};

const getDefaultRef = (): number[] => {
  let book = 45;
  let chapter = 5;
  let verse = 3;

  const refParam = getRefParam();

  if (refParam) {
    const parsedRegex = /^(\w+)(\.)(\w+)(\.)(\w+)$/.exec(refParam);

    if (parsedRegex) {
      const parsedBook = getBookNumber(parsedRegex[1]);

      if (parsedBook) {
        book = parsedBook;
      }
      const parsedChapter = Number(parsedRegex[3] ?? undefined);

      if (parsedChapter && Number.isFinite(parsedChapter)) {
        chapter = parsedChapter;
      }

      const parsedVerse = Number(parsedRegex[5]);
      if (parsedVerse && Number.isFinite(parsedVerse)) {
        verse = parsedVerse;
      }
    }
  }

  return [book, chapter, verse];
};

const Workbench: React.FC<WorkbenchProps> = (): ReactElement => {
  const [defaultBook, defaultChapter, defaultVerse] = getDefaultRef();

  document.title = getRefParam()
    ? `${documentTitle} ${getRefParam()}`
    : documentTitle;

  const [theme] = React.useState('night');
  const [corpora, setCorpora] = React.useState<Corpus[]>([]);

  const [book] = React.useState(defaultBook);
  const [chapter] = React.useState(defaultChapter);
  const [verse] = React.useState(defaultVerse);

  const [syntaxData, setSyntaxData] = React.useState(
    placeholderTreedown as SyntaxRoot
  );

  const bookDoc = React.useMemo(() => books.find((bookItem) => bookItem.BookNumber === book), [book]);

  const updateCorpora = React.useCallback(() => {
    new Promise((res) => {
      const retrievedCorpora: Corpus[] = [];
      const texts = Object.values(CorpusType);
      texts.forEach((text, idx) => {
        queryText(text, book, chapter, verse).then(foundCorpora => {
          retrievedCorpora.push({
            ...foundCorpora,
            syntax: {...syntaxData, _syntaxType: SyntaxType.Source},
          });
          if(idx === text.length - 1) {
            res(retrievedCorpora);
          }
        });
      });
    }).then(res => setCorpora(res as Corpus[]));
  }, [book, chapter, verse, syntaxData]);

  React.useEffect(() => {
    void updateCorpora();
    const loadSyntaxData = async () => {
      try {
        const syntaxData = await fetchSyntaxData(bookDoc, chapter, verse);
        if (syntaxData) {
          setSyntaxData(syntaxData as SyntaxRoot);
          document.title = `${documentTitle} ${
            bookDoc ? bookDoc.OSIS : book
          }.${chapter}.${verse}`;
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadSyntaxData().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookDoc, book, chapter, verse]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem',
          border: '1px solid',
          margin: 'auto',
          marginTop: '1rem',
          marginBottom: '1rem',
          maxWidth: '1200px',
        }}
      >
        <EditorWrapper
          theme={theme as 'night' | 'day'}
          corpora={corpora}
          alignments={[
            {
              source: 'leb',
              target: 'nvi',
              links: [
                { targets: ['nvi_0'], sources: ['leb_0'] },
                { targets: ['nvi_1'], sources: ['leb_1'] },
                { targets: ['nvi_2'], sources: ['leb_2'] },
                { targets: ['nvi_4'], sources: ['leb_3'] },
                { targets: ['nvi_5'], sources: ['leb_4'] },
                { targets: ['nvi_6'], sources: ['leb_6'] },
                { targets: ['nvi_7'], sources: ['leb_8'] },
                { targets: ['nvi_8', 'nvi_9'], sources: ['leb_9', 'leb_10'] },
                { targets: ['nvi_10'], sources: ['leb_11'] },
                { targets: ['nvi_11'], sources: ['leb_12', 'leb_13'] },
                { targets: ['nvi_12'], sources: ['leb_14'] },
                { targets: ['nvi_14'], sources: ['leb_15'] },
                { targets: ['nvi_15'], sources: ['leb_16'] },
                { targets: ['nvi_16'], sources: ['leb_17', 'leb_18'] },
              ],
              polarity: {
                type: 'secondary',
                mappedSide: 'targets',
                nonMappedSide: 'sources',
              },
            },
            {
              source: 'sbl',
              target: 'nvi',
              links: [
                { sources: ['450050030010010'], targets: ['nvi_1'] },
                { targets: ['nvi_2'], sources: ['450050030020010'] },
                { targets: ['nvi_0'], sources: ['450050030030010'] },
                { targets: ['nvi_5'], sources: ['450050030040010'] },
                { targets: ['nvi_6'], sources: ['450050030050010'] },
                { targets: ['nvi_7'], sources: ['450050030070010'] },
                {
                  targets: ['nvi_8', 'nvi_9'],
                  sources: ['450050030080010', '450050030090010'],
                },
                { targets: ['nvi_11'], sources: ['450050030100010'] },
                { targets: ['nvi_12'], sources: ['450050030110010'] },
                { targets: ['nvi_13'], sources: ['450050030120010'] },
                { targets: ['nvi_14'], sources: ['450050030130010'] },
                { targets: ['nvi_16'], sources: ['450050030140010'] },
                { targets: ['nvi_15'], sources: ['450050030150010'] },
              ],
              polarity: {
                type: 'primary',
                syntaxSide: 'sources',
                nonSyntaxSide: 'targets',
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

export default Workbench;
