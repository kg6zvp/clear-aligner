import { DisplayableLink } from '../structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import _ from 'lodash';

export const findFirstRefFromLink = (
  row: DisplayableLink
): BCVWP | undefined => {
  const refString = _.uniqWith([...row.sources, ...row.targets], _.isEqual)
    .sort()
    .find((value) => value);
  if (!refString) {
    return undefined;
  }
  return BCVWP.parseFromString(refString);
};
