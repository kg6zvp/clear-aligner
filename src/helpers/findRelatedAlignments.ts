import { Alignment, Word, Link } from 'structs';

// Takes an array of `Alignment` and a `Word`.
// Returns only `Alignment` items that include the word.
// `Alignment` `Link`s are filtered by relation to the word.
const findRelatedAlignments = (
  unfilteredAlignments: Alignment[],
  word: Word
): Alignment[] => {
  return unfilteredAlignments.reduce((acc, curAlignment) => {
    let filteredLinks = curAlignment.links.filter((link: Link) => {
      switch (word.side) {
        case 'sources':
          return link.sources.includes(word.id);
        case 'targets':
          return link.targets.includes(word.id);
        default:
          return false;
      }
    });

    if (filteredLinks.length) {
      acc.push({ ...curAlignment, links: filteredLinks });
    }

    // return accumulator
    return acc;
  }, [] as Alignment[]);
};

export default findRelatedAlignments;
