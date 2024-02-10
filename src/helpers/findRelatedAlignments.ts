import { Word, Link } from 'structs';
import { ProjectState } from '../state/databaseManagement';
import BCVWP from '../features/bcvwp/BCVWPSupport';

// Takes `ProjectState` and a `Word`.
// calls back with `Link` items that include the word.
// `Link`s are filtered by relation to the word.
const findRelatedAlignments = (
  projectState: ProjectState,
  word: Word,
  callback: (payload: Link[]) => void
): void => {
  if (!projectState.linksTable) {
    callback([]);
    return;
  }
  projectState.linksTable
    .findByWord(word.side, BCVWP.parseFromString(word.id))
    .then((results) => callback(results));
};

export default findRelatedAlignments;
