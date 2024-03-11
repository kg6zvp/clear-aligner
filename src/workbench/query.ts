import { AlignmentSide, Corpus, CorpusContainer, CorpusFileFormat, Verse, Word } from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';

// @ts-ignore
import MACULA_SBLGNT from 'tsv/source_macula_greek_SBLGNT.tsv';
// @ts-ignore
import MACULA_HEBOT_TSV from 'tsv/source_macula_hebrew.tsv';
// @ts-ignore
import YLT from 'tsv/ylt-new.tsv';
import { DefaultProjectName, EmptyWordId } from 'state/links/tableManager';

enum InitializationStates {
  UNINITIALiZED,
  INITIALIZING,
  INITIALIZED
}

let initializationState: InitializationStates = InitializationStates.UNINITIALiZED;

const availableCorpora: CorpusContainer[] = [];

const parseTsvByFileType = async (
  tsv: RequestInfo,
  refCorpus: Corpus,
  side: AlignmentSide,
  fileType: CorpusFileFormat
): Promise<Corpus> => {
  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  const [header, ...rows] = response.split('\n');
  const headerMap: Record<string, number> = {};
  if (!refCorpus.wordsByVerse) {
    refCorpus.wordsByVerse = {} as Record<string, Verse>;
  }

  header.split('\t').forEach((header, idx) => {
    header = header === 'identifier' ? 'id' : header; //Standard for header in files will be id
    headerMap[header] = idx;
  });
  const hasGloss = !!(headerMap['english'] ?? headerMap['gloss']);

  rows.forEach((row) => {
    const values = row.split('\t');

    let id, wordKey, wordRef: BCVWP, pos, word: Word, verse;

    switch (fileType) {
      case CorpusFileFormat.TSV_TARGET:
        // filter out punctuation in content
        if ([
          values[headerMap['token']],
          values[headerMap['text']]
        ].some(v => !!(v ?? '').match(/^\p{P}$/gu))
        ) {
          // skip punctuation
          return;
        }

        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['id']];
        if (!BCVWP.isValidString(id)) {
          return;
        }
        wordRef = BCVWP.parseFromString(id);
        pos = +id.substring(8, 11); // grab word position
        word = {
          id: id, // standardize n40001001002 to  40001001002
          side,
          corpusId: refCorpus.id,
          text: values[headerMap['text']] || values[headerMap['lemma']] || '',
          position: pos
        };

        wordKey = word.text.toLowerCase();
        if (refCorpus.wordLocation.has(wordKey)) {
          refCorpus.wordLocation.get(wordKey)?.add(wordRef);
        } else {
          refCorpus.wordLocation.set(wordKey, new Set<BCVWP>([wordRef]));
        }
        verse = refCorpus.wordsByVerse[id.substring(0, 8)] || {};
        refCorpus.wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          sourceVerse: values[headerMap['source_verse']],
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word])
        };
        refCorpus.words.push(word);
        break;

      case CorpusFileFormat.TSV_MACULA:
      default: // grab word position
        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['xml:id']].slice(1);
        pos = +id.substring(8, 11);
        // Gloss is defined at this level since both english and gloss headers can exist.
        // Either could be null within the TSV file.
        const gloss = values[headerMap['english']] || values[headerMap['gloss']] || '-';

        word = {
          id: id, // standardize n40001001002 to  40001001002
          corpusId: refCorpus.id,
          side,
          text: values[headerMap['text']] || values[headerMap['lemma']] || '',
          after: values[headerMap['after']],
          position: pos,
          gloss: (new RegExp(/^(.+\..+)+$/)).test(gloss)
            ? gloss.replaceAll('.', ' ')
            : gloss
        } as Word;

        wordRef = BCVWP.parseFromString(id);
        wordKey = word.text.toLowerCase();
        if (refCorpus.wordLocation.has(wordKey)) {
          refCorpus.wordLocation.get(wordKey)?.add(wordRef);
        } else {
          refCorpus.wordLocation.set(wordKey, new Set<BCVWP>([wordRef]));
        }

        verse = refCorpus.wordsByVerse[id.substring(0, 8)] || {};
        refCorpus.wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word])
        };
        refCorpus.words.push(word);
        break;
    }
  });

  return {
    ...refCorpus,
    hasGloss
  };
};

const putVerseInCorpus = (corpus: Corpus, verse: Verse) => {
  if (!(verse.bcvId.book && verse.bcvId.chapter && verse.bcvId.verse)) {
    return;
  }
  if (!corpus.books) {
    corpus.books = {};
  }
  if (!corpus.books[verse.bcvId.book]) {
    corpus.books[verse.bcvId.book] = {};
  }
  const bookRef = corpus.books[verse.bcvId.book];
  if (!bookRef[verse.bcvId.chapter]) {
    bookRef[verse.bcvId.chapter] = {};
  }
  const chapterRef = bookRef[verse.bcvId.chapter];
  chapterRef[verse.bcvId.verse] = verse;
};

const putVersesInCorpus = (corpus: Corpus) => {
  Object.values(corpus.wordsByVerse).forEach((verse) =>
    putVerseInCorpus(corpus, verse)
  );
};

const waitForInitialization = async () => {
  while (initializationState !== InitializationStates.INITIALIZED) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

const WordQueryBatchSize = 100_000;

export const getCorpusFromDatabase = async (
  inputCorpus: Corpus
): Promise<Corpus> => {
  inputCorpus.wordsByVerse = {} as Record<string, Verse>;
  inputCorpus.words = [];
  let offset = 0;
  while (true) {
    // @ts-ignore
    const words = ((await window.databaseApi.getAllWordsByCorpus(
      DefaultProjectName,
      inputCorpus.side,
      inputCorpus.id,
      WordQueryBatchSize, offset)) as Word[]);
    if (!words
      || words.length < 1) {
      break;
    }
    for (const word of words) {
      if (!word.text
        || (word.text ?? '')
          .match(/^\p{P}$/gu)) {
        continue;
      }
      const verseId = (word.id ?? EmptyWordId).substring(0, 8);
      const verseBCV = BCVWP.parseFromString(verseId);
      const verse: Verse = inputCorpus.wordsByVerse[verseId] ?? {};
      inputCorpus.wordsByVerse[verseId] = {
        ...verse,
        sourceVerse: verseId,
        bcvId: verseBCV,
        citation: verse.citation ?? `${verseBCV.book}:${verseBCV.verse}`,
        words: (verse.words || []).concat([word])
      };
      inputCorpus.words.push(word);
    }
    offset += WordQueryBatchSize;
  }
  return inputCorpus;
};

export const getAvailableCorporaContainers = async (): Promise<
  CorpusContainer[]
> => {
  if (initializationState === InitializationStates.UNINITIALiZED) {
    initializationState = InitializationStates.INITIALIZING;

    // @ts-ignore
    const inputCorpora = (((await window.databaseApi.getAllCorpora(DefaultProjectName)) as Corpus[]) ?? []);
    const outputCorpora: Corpus[] = [];
    for (const inputCorpus of inputCorpora) {
      const outputCorpus = (await getCorpusFromDatabase({
        ...inputCorpus,
        words: [],
        wordsByVerse: {},
        wordLocation: new Map<string, Set<BCVWP>>(),
        books: {},
        hasGloss: true
      } as Corpus));
      putVersesInCorpus(outputCorpus);
      outputCorpora.push(outputCorpus);
    }

    const sourceContainer = CorpusContainer.fromIdAndCorpora('source',
      outputCorpora.filter(outputCorpus => outputCorpus.side === AlignmentSide.SOURCE));
    const targetContainer = CorpusContainer.fromIdAndCorpora('target',
      outputCorpora.filter(outputCorpus => outputCorpus.side === AlignmentSide.TARGET));

    availableCorpora.push(sourceContainer);
    availableCorpora.push(targetContainer);
    initializationState = InitializationStates.INITIALIZED;
  } else if (initializationState === InitializationStates.INITIALIZING) {
    await waitForInitialization();
  }

  return availableCorpora;
};

export const getAvailableCorporaIds = async (): Promise<string[]> => {
  return (
    initializationState ? availableCorpora : await getAvailableCorporaContainers()
  ).map((corpus) => {
    return corpus.id;
  });
};
