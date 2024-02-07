import { createDesignDoc } from './pouchDbHelpers';
import { Link } from '../structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import _ from 'lodash';

/***********
 * sources *
 ***********/
export const SourcesIndex = 'SOURCE_WORD_IDS';
const sourcesIndexMap = (link: Link) => link.sources
  .map((source) => {
    console.log('source', source);
    return source;
  })
  .forEach(PouchDB.emit);
const sourcesIndexDoc = createDesignDoc<Link>(SourcesIndex, sourcesIndexMap);

/***************
 * source book *
 ***************/

/**
 * index name for the book value in the sources, use this when executing queries
 */
export const SourceBookIndex = 'SOURCE_BOOK';

/**
 * index function used when calling `find` to retrieve links in the given book on the source side
 */
const sourceBookIndexMap = (link: Link) => {
  _.uniqWith(link.sources
    .map(BCVWP.parseFromString)
    .map(( value ) => value.book), _.isEqual)
    .map(String)
    .forEach(PouchDB.emit);
};

/**
 * index design document (index)
 */
const sourceBookIndexDoc = createDesignDoc<Link>(SourceBookIndex, sourceBookIndexMap);

/******************
 * source chapter *
 ******************/

/**
 * index name for source chapters
 */
export const SourceChapterIndex = 'SOURCE_CHAPTER';

const sourceChapterIndexMap = (link: Link) => {
  _.uniqWith(link.sources
    .map(BCVWP.parseFromString)
    .map(( value ) => value.chapter), _.isEqual)
    .map(String)
    .forEach(PouchDB.emit);
}

/**
 * index design document (persistent index)
 */
const sourceChapterIndexDoc = createDesignDoc<Link>(SourceChapterIndex, sourceChapterIndexMap);

/****************
 * source verse *
 ****************/

export const SourceVerseIndex = 'SOURCE_VERSE';

const sourceVerseIndexMap = (link: Link) => {
  _.uniqWith(link.sources
    .map(BCVWP.parseFromString)
    .map(( value ) => value.verse), _.isEqual)
    .map(String)
    .forEach(PouchDB.emit);
}

const sourceVerseIndexDoc = createDesignDoc<Link>(SourceVerseIndex, sourceVerseIndexMap);

/***********
 * targets *
 ***********/
export const TargetsIndex = 'TARGET_WORD_IDS';
const targetsIndexMap = (link: Link) => link.targets
  .map((target) => {
    console.log('target', target);
    return target;
  })
  .forEach(PouchDB.emit);
const targetsIndexDoc = createDesignDoc<Link>(TargetsIndex, targetsIndexMap);

/***************
 * target book *
 ***************/

/**
 * index name for the book value in the targets, use this when executing queries
 */
export const TargetBookIndex = 'TARGET_BOOK';

/**
 * index function used when calling `find` to retrieve links in the given book on the target side
 */
const targetBookIndexMap = (link: Link) => {
  _.uniqWith(link.targets
    .map(BCVWP.parseFromString)
    .map(( value ) => value.book), _.isEqual)
    .map(String)
    .forEach(PouchDB.emit);
};

/**
 * index design document (
 */
const targetBookIndexDoc = createDesignDoc<Link>(TargetBookIndex, targetBookIndexMap);

/******************
 * target chapter *
 ******************/

/**
 * index name for the chapter value in the targets, use this when executing queries
 */
export const TargetChapterIndex = 'TARGET_CHAPTER';

/**
 * index function used when calling `find` to retrieve links in the given chapter on the target side
 */
const targetChapterIndexMap = (link: Link) => {
  _.uniqWith(link.targets
    .map(BCVWP.parseFromString)
    .map(( value ) => value.chapter), _.isEqual)
    .map(String)
    .forEach(PouchDB.emit);
};

/**
 * index design document (
 */
const targetChapterIndexDoc = createDesignDoc<Link>(TargetChapterIndex, targetChapterIndexMap);

/******************
 * target verse *
 ******************/

/**
 * index name for the verse value in the targets, use this when executing queries
 */
export const TargetVerseIndex = 'TARGET_VERSE';

/**
 * index function used when calling `find` to retrieve links in the given verse on the target side
 */
const targetVerseIndexMap = (link: Link) => {
  _.uniqWith(link.targets
    .map(BCVWP.parseFromString)
    .map(( value ) => value.verse), _.isEqual)
    .map(String)
    .forEach(PouchDB.emit);
};

/**
 * index design document (
 */
const targetVerseIndexDoc = createDesignDoc<Link>(TargetVerseIndex, targetVerseIndexMap);

export const LinksIndexDocs = [
  sourcesIndexDoc,
  sourceBookIndexDoc,
  sourceChapterIndexDoc,
  sourceVerseIndexDoc,
  targetsIndexDoc,
  targetBookIndexDoc,
  targetChapterIndexDoc,
  targetVerseIndexDoc,
];
