import { Word, Link } from 'structs';
import { ProjectState } from '../state/databaseManagement';
import { SourcesIndex, TargetsIndex } from '../state/linksIndexes';

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
    .query(word.side === 'sources' ? SourcesIndex : TargetsIndex, { key: word.id, include_docs: true })
    .then((result) => {
      callback(result.rows
        .map((link) => link as unknown as Link));
    });
};

export default findRelatedAlignments;
