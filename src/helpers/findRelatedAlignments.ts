import { Word, Link } from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import { VirtualTableLinks } from '../state/links/tableManager';

// Takes `ProjectState` and a `Word`.
// calls back with `Link` items that include the word.
// `Link`s are filtered by relation to the word.
const findRelatedAlignments = (
  word: Word,
  callback: (payload: Link[]) => void,
  linksTable?: VirtualTableLinks,
): void => {
  if (!linksTable) {
    callback([]);
    return;
  }
  linksTable
    .findByWord(word.side, BCVWP.parseFromString(word.id))
    .then((results) => callback(results));
};

export default findRelatedAlignments;
