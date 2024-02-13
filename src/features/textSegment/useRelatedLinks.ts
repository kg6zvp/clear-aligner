import { Link, Word } from '../../structs';
import { useContext, useEffect, useState } from 'react';
import findRelatedAlignments from '../../helpers/findRelatedAlignments';
import { AppContext } from '../../App';

/**
 * hook to find links related to a given word
 * @param word word to find links related to
 */
export const useRelatedLinks = (word?: Word|null): Link[] => {
  const { projectState } = useContext(AppContext);
  const [ relatedLinks, setRelatedLinks ] = useState([] as Link[]);

  useEffect(() => {
    if (word) {
      findRelatedAlignments(word, projectState.linksTable)
        .then(setRelatedLinks);
    }
  }, [projectState.linksTable, setRelatedLinks, word]);

  return relatedLinks;
}
