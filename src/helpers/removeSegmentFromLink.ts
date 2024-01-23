import { Link, Word } from 'structs';

const removeFromArray = (originArray: string[], id: string): string[] => {
  const _array = originArray.concat([]);
  const index = _array.findIndex((sourceId: string) => sourceId === id);
  _array.splice(index, 1);
  return _array;
};

const removeSegmentFromLink = (wordToRemove: Word, link: Link): Link => {
  switch (wordToRemove.side) {
    case 'sources':
      link.sources = removeFromArray(link.sources, wordToRemove.id);
      break;
    case 'targets':
      link.targets = removeFromArray(link.targets, wordToRemove.id);
      break;
  }

  return link;
};

export default removeSegmentFromLink;
