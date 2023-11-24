import React, {ReactElement} from 'react';

import {Corpus, SyntaxRoot} from 'structs';

import EditorWrapper from 'features/editor';

import fetchSyntaxData from 'workbench/fetchSyntaxData';

import {getAvailableCorporaIds, queryText} from 'workbench/query';
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

const Workbench = (props: WorkbenchProps): ReactElement => {
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

  const bookDoc = React.useMemo(
    () => books.find((bookItem) => bookItem.BookNumber === book),
    [books]
  );

  const updateCorpora = React.useCallback(async () => {
    const corporaIds = await getAvailableCorporaIds();
    const retrievedCorpora: Corpus[] = [];

    for (const corpusId of corporaIds) {
      retrievedCorpora.push(await queryText(corpusId, book, chapter, verse));
    }

    setCorpora(retrievedCorpora);
  }, []);

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
          alignments={[]}
        />
      </div>
    </div>
  );
};

export default Workbench;
