import BCVWP from '../../features/bcvwp/BCVWPSupport';
import { PersistentInternalLink } from './link';

export enum Link_SourceColumns {
  linkId = 'linkId',
  sourceWordOrPart = 'sourceWordOrPart',
  book = 'book',
  /*chapter = 'chapter',
  verse = 'verse',
  word = 'word',
  part = 'part',//*/
}

/**
 * single join of a source to a link
 */
export interface InternalLink_Source {
  linkId: string;
  sourceWordOrPart: string;
}

/**
 * computed properties upon insert/update
 */
export interface PersistentLink_Source extends InternalLink_Source {
  /**
   * computed id field: `${linkId}-${sourceWordOrPart}`
   */
  _id: string;

  book: number;
  /*chapter: number;
  verse: number;
  word: number;
  part?: number;//*/
}

/**
 * convert an individual source and a link into the representation that will be persisted
 * @param src source coordinates
 * @param link associated link
 */
export const toLinkSources = (src: string, link: PersistentInternalLink): PersistentLink_Source => {
  const internalLinkedSource: InternalLink_Source = ({
    linkId: link._id,
    sourceWordOrPart: BCVWP.parseFromString(src).toReferenceString()
  });
  return persistableLinkSource(internalLinkedSource);
}

const persistableLinkSource = (linkSource: InternalLink_Source): PersistentLink_Source => {
  const ref = BCVWP.parseFromString(linkSource.sourceWordOrPart);
  return {
    ...linkSource,
    _id: `${linkSource.linkId}-${linkSource.sourceWordOrPart}`,
    book: ref.book!,
    /*chapter: ref.chapter!,
    verse: ref.verse!,
    word: ref.word!,
    part: ref.part,//*/
  };
}
