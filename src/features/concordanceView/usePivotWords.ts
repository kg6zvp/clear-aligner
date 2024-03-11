import { PivotWord } from './structs';
import { AlignmentSide } from '../../structs';
import { useEffect, useState } from 'react';
import { DefaultProjectName } from '../../state/links/tableManager';
import { useDatabase } from '../../hooks/useDatabase';
import { GridSortItem } from '@mui/x-data-grid';
import { PivotWordFilter } from './concordanceView';
import { useLanguages } from '../../hooks/useLanguages';

export const usePivotWords = (side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null): PivotWord[] | undefined => {
  const databaseApi = useDatabase();
  const languages = useLanguages();
  const [pivotWords, setPivotWords] = useState<PivotWord[] | undefined>(undefined);

  useEffect(() => {
    if (!languages) return;
    const load = async () => {
      console.time(`usePivotWords(side: '${side}', filter: '${filter}', sort: ${JSON.stringify(sort)})`);
      const pivotWordList = (await databaseApi.corporaGetPivotWords(DefaultProjectName, side, filter, sort));
      console.timeEnd(`usePivotWords(side: '${side}', filter: '${filter}', sort: ${JSON.stringify(sort)})`);

      setPivotWords(pivotWordList
        .map(({ t, c, l }): PivotWord => ({
          side,
          normalizedText: t,
          frequency: c,
          languageInfo: languages.get(l)!
        })));
    };

    void load();
  }, [side, filter, sort, setPivotWords, databaseApi, languages]);

  return pivotWords;
};
