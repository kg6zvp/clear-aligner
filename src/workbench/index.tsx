import React, {ReactElement} from 'react';

import {Corpus, SyntaxRoot, SyntaxType} from 'structs';

import EditorWrapper from 'features/editor';

import fetchSyntaxData from 'workbench/fetchSyntaxData';

import {getAvailableCorporaIds, queryText} from 'workbench/query';
import books from 'workbench/books';

import placeholderTreedown from 'features/treedown/treedown.json';
import BCVWP from "../BCVWP/BCVWPSupport";

interface WorkbenchProps {
  corpora?: Corpus[];
  currentPosition: BCVWP;
}

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

const Workbench: React.FC<WorkbenchProps> = ({ corpora, currentPosition }: WorkbenchProps): ReactElement => {
  const [defaultBook, defaultChapter, defaultVerse] = getDefaultRef();

  document.title = getRefParam()
    ? `${documentTitle} ${getRefParam()}`
    : documentTitle;

  const [showSourceText, setShowSourceText] = React.useState(true);
  const [showTargetText, setShowTargetText] = React.useState(true);
  const [showLwcText, setShowLwcText] = React.useState(true);
  const [showBackText, setShowBackText] = React.useState(true);

  const book = currentPosition.book ?? 0;
  const chapter = currentPosition.chapter ?? 1;
  const verse = currentPosition.verse ?? 1;

  const bookDoc = React.useMemo(
    () => books.find((bookItem) => bookItem.BookNumber === book),
    [book]
  );

  React.useEffect(() => {
    const loadSyntaxData = async () => {
      try {
        const loadedSyntaxData = await fetchSyntaxData(bookDoc, chapter, verse);
        if (loadedSyntaxData) {
          document.title = `${documentTitle} ${
            bookDoc ? bookDoc.OSIS : book
          }.${chapter}.${verse}`;
        }

        const corporaIds = await getAvailableCorporaIds();
        const retrievedCorpora: Corpus[] = [];

        for (const corpusId of corporaIds) {
          retrievedCorpora.push(await queryText(corpusId, book, chapter, verse));
        }

        // set the syntax
        retrievedCorpora.forEach((corpus) => {
          corpus['syntax'] = {...loadedSyntaxData as SyntaxRoot, _syntaxType: SyntaxType.Source};
        })

        setCorpora(retrievedCorpora);
      } catch (error) {
        console.error(error);
      }
    };

    loadSyntaxData().catch(console.error);
  }, [bookDoc, book, chapter, verse]);

  const corpora: Corpus[] = [];

  if (showSourceText) {
    const sourceCorpus = {
      ...queryText('sbl', book, chapter, verse),
      syntax: { ...syntaxData, _syntaxType: SyntaxType.Source },
    };

    corpora.push(sourceCorpus);
  }

  if (showTargetText) {
    corpora.push({
      ...queryText('nvi', book, chapter, verse),
      syntax: { ...syntaxData, _syntaxType: SyntaxType.Mapped },
    });
  }

  if (showLwcText) {
    corpora.push({
      ...queryText('leb', book, chapter, verse),
      syntax: { ...syntaxData, _syntaxType: SyntaxType.MappedSecondary },
    });
  }

  if (showBackText) {
    corpora.push(queryText('backTrans', book, chapter, verse));
  }

  return (<>
      {corpora &&
          (<div>
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
          corpora={corpora}
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
        />
      </div>
    </div>)}
      </>);
};

export default Workbench;
