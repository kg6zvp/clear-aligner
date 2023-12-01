import { Corpus, Word } from 'structs';

export const findWordById = (corpora: Corpus[], wordId: string) => {
  for (const corpus of corpora) {
    const found = (corpus.wordsByVerse[wordId.substring(0, 8)]?.words || [])
      .find((word: Word) => word.id === wordId);

    if (Boolean(found)) {
      return found;
    }
  }
  return undefined;
};

export default findWordById;
