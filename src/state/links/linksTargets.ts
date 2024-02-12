import BCVWP, { BCVWPField } from '../../features/bcvwp/BCVWPSupport';
import { PersistentInternalLink } from './link';

export enum Link_TargetColumns {
  linkId = 'linkId',
  targetWordOrPart = 'sourceWordOrPart',
  book = 'book',
  chapter = 'chapter',
  verse = 'verse',
  word = 'word',
  part = 'part',
}

/**
 * single join of a source to a link
 */
export interface InternalLink_Target {
  linkId: string;
  targetWordOrPart: string;
}

/**
 * computed properties upon insert/update
 */
export interface PersistentLink_Target extends InternalLink_Target {
  /**
   * computed id field: `${linkId}-${targetWordOrPart}`
   */
  _id: string;

  book: number;
  chapter: number;
  verse: number;
  word: number;
  part?: number;
}

/**
 * convert an individual target and a link into the representation that will be persisted
 * @param tgt target coordinates
 * @param link associated link
 */
export const toLinkTargets = (tgt: string, link: PersistentInternalLink): PersistentLink_Target => {
  const internalLinkedTarget: InternalLink_Target = ({
    linkId: link._id,
    targetWordOrPart: tgt
  });
  return persistableLinkTarget(internalLinkedTarget);
}

const persistableLinkTarget = (linkTarget: InternalLink_Target): PersistentLink_Target => {
  const ref = BCVWP.parseFromString(linkTarget.targetWordOrPart);
  /*if (!ref.hasFields(BCVWPField.Book, BCVWPField.Chapter, BCVWPField.Verse, BCVWPField.Word)) {
    throw new Error(`link id ${linkTarget.linkId} includes too short a target: ${linkTarget.targetWordOrPart}`)
  } //*/
  return {
    ...linkTarget,
    _id: `${linkTarget.linkId}-${linkTarget.targetWordOrPart}`,
    book: ref.book!,
    chapter: ref.chapter!,
    verse: ref.verse!,
    word: ref.word!,
    part: ref.part,
  };
}
