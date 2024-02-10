import { Link } from '../../structs';
import { InternalLink_Source, PersistentLink_Source, toLinkSources } from './linksSources';
import { InternalLink_Target, PersistentLink_Target, toLinkTargets } from './linksTargets';
import { v4 as uuidv4 } from 'uuid';

/**
 * This file deals with the abstraction required to represent a link across three databases and maintain their relationships
 */

/**
 * internal representation of a link prepped for storage in the database
 */
export interface InternalLink {
  link: PersistentInternalLink;
  sources: PersistentLink_Source[];
  targets: PersistentLink_Target[];
}

/**
 * individual data point actually persisted to the `links` database
 */
export interface PersistentInternalLink {
  _id: string;
}

/**
 * convert to a persistent link
 * @param link
 */
const toPersistentLink = (link: Link): PersistentInternalLink => ({
  _id: link.id ?? uuidv4()
})

/**
 * before persisting, convert a link to persistent forms
 * @param link to convert for persistence
 */
export const prePersistLink = (link: Link): InternalLink => {
  const persistentLink = toPersistentLink(link);
  return ({
    link: persistentLink,
    sources: link.sources.map((src) => toLinkSources(src, persistentLink)),
    targets: link.targets.map((tgt) => toLinkTargets(tgt, persistentLink)),
  });
}

/**
 * takes components from all three tables and reconstitutes a Link
 * @param internal data from all three tables
 */
export const preRetrieveLink = (internal: InternalLink): Link => ({
  id: internal.link._id,
  sources: internal.sources.map(({ sourceWordOrPart }) => sourceWordOrPart),
  targets: internal.targets.map(({ targetWordOrPart }) => targetWordOrPart),
})
