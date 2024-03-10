import { AlignedWord } from './structs';
import { GridSortItem } from '@mui/x-data-grid';
import { Link } from '../../structs';
import { useEffect, useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { DefaultProjectName } from '../../state/links/tableManager';

export const useLinksFromAlignedWord = (alignedWord?: AlignedWord, sort?: GridSortItem|null): Link[] | undefined => {
  const db = useDatabase();
  const [ links, setLinks ] = useState<Link[]|undefined>(undefined);

  useEffect(() => {
    if (!alignedWord) return;
    const load = async () => {
      const links = await db.corporaGetLinksByAlignedWord(DefaultProjectName, alignedWord.sourceWordTexts.text, alignedWord.targetWordTexts.text, sort);
      setLinks(links);
    }

    void load();
  }, [alignedWord, sort, setLinks]);

  return links;
}
