import React, {ReactElement} from 'react';

import EditorWrapper from 'features/editor';

import {convertBcvToIdentifier} from 'workbench/query';
import books from 'workbench/books';

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
  const [defaultBook, defaultChapter, defaultVerse] = React.useMemo(() => getDefaultRef(), []);
  document.title = getRefParam()
    ? `${documentTitle} ${getRefParam()}`
    : documentTitle;

  const [theme] = React.useState('night');
  const [book] = React.useState(defaultBook);
  const [chapter] = React.useState(defaultChapter);
  const [verse] = React.useState(defaultVerse);
  const bcvId = React.useMemo(() => convertBcvToIdentifier(book, chapter, verse), [book, chapter, verse]);

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
          alignments={[
            {
              source: 'sbl-gnt',
              target: 'na27-YLT',
              links: [],
              polarity: {
                type: 'primary',
                syntaxSide: 'sources',
                nonSyntaxSide: 'targets',
              },
            },
          ]}
          bcvId={bcvId}
        />
      </div>
    </div>
  );
};

export default Workbench;
