/**
 * This file contains the findFirstRefFromLink helper function which is used in
 * the AlignmentTable component in the Concordance View.
 */
import { Link } from '../structs';
import _ from 'lodash';
import { AlignmentSide } from '../common/data/project/corpus';

export const findFirstRefFromLink = (
  row: Link,
  wordSource?: AlignmentSide
): string | undefined => {
  let rowByWordSource: string[];
  switch(wordSource) {
    case AlignmentSide.SOURCE:
      rowByWordSource = row.sources;
      break;
    case AlignmentSide.TARGET:
      rowByWordSource = row.targets;
      break;
    default:
      rowByWordSource = [...row.sources, ...row.targets];
      break;
  }

  return _.uniqWith(rowByWordSource, _.isEqual)
    .sort()
    .find((value) => value);
}
