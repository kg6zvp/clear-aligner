import { Word, Link } from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import { VirtualTableLinks } from '../state/links/tableManager';

// Takes `ProjectState` and a `Word`.
// calls back with `Link` items that include the word.
// `Link`s are filtered by relation to the word.
const findRelatedAlignments = async (
  word: Word,
  linksTable?: VirtualTableLinks,
): Promise<Link[]> => {
  if (!linksTable) {
    return [];
  }
  return await linksTable
    .findByWord(word.side, BCVWP.parseFromString(word.id));
};

export default findRelatedAlignments;
