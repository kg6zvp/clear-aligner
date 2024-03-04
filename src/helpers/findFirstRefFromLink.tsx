import { Link } from '../structs';
import _ from 'lodash';

export const findFirstRefFromLink = (
  row: Link,
  wordSource?: AlignmentSide
): string | undefined => {
  let rowByWordSource: string[];
  switch(wordSource) {
    case WordSource.SOURCE:
      rowByWordSource = row.sources;
      break;
    case WordSource.TARGET:
      rowByWordSource = row.targets;
      break;
    default:
      rowByWordSource = [...row.sources, ...row.targets];
      break;
  }
  _.uniqWith(rowByWordSource, _.isEqual)
    .sort()
    .find((value) => value);
}
