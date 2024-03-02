import { Link } from '../structs';
import _ from 'lodash';

export const findFirstRefFromLink = (
  row: Link
): string | undefined =>
  _.uniqWith([...row.sources, ...row.targets], _.isEqual)
    .sort()
    .find((value) => value);
