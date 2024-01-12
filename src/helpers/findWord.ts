import { Corpus, Word } from 'structs';
import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';

export const findWordById = (corpora: Corpus[], word: BCVWP) => {
  for (const corpus of corpora) {
    const found = (
      corpus.wordsByVerse[word.toTruncatedReferenceString(BCVWPField.Verse)]
        ?.words || []
    ).find((w: Word) =>
      word.matchesTruncated(BCVWP.parseFromString(w.id), BCVWPField.Part)
    );

    if (Boolean(found)) {
      return found;
    }
  }
  return undefined;
};

export default findWordById;
