import { PivotWord } from './structs';
import { AlignmentSide } from '../../structs';
import { useContext, useEffect, useState } from 'react';
import { DefaultProjectName } from '../../state/links/tableManager';
import { useDatabase } from '../../hooks/useDatabase';
import { GridSortItem } from '@mui/x-data-grid';
import { PivotWordFilter } from './concordanceView';
import { useLanguages } from '../../hooks/useLanguages';
import { AppContext } from '../../App';

export const usePivotWords = (side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null): {
  refetch: CallableFunction;
  pivotWords: PivotWord[] | undefined;
} => {
  const {preferences} = useContext(AppContext);
  const [initializeIndices, setInitializeIndices] = useState(false);
  const databaseApi = useDatabase();
  const languages = useLanguages();
  const [pivotWords, setPivotWords] = useState<PivotWord[] | undefined>(undefined);

  useEffect(() => {
    if (!languages && !initializeIndices) return;
    const load = async () => {
      console.time(`usePivotWords(side: '${side}', filter: '${filter}', sort: ${JSON.stringify(sort)})`);
      const pivotWordList = (await databaseApi.corporaGetPivotWords(preferences?.currentProject ?? DefaultProjectName, side, filter, sort));
      console.timeEnd(`usePivotWords(side: '${side}', filter: '${filter}', sort: ${JSON.stringify(sort)})`);

      setPivotWords(pivotWordList
        .map(({ t, c, l }): PivotWord => ({
          side,
          normalizedText: t,
          frequency: c,
          languageInfo: languages?.get?.(l)!
        })));
    };
    setInitializeIndices(false);
    void load();
  }, [side, filter, sort, setPivotWords, databaseApi, languages, initializeIndices, preferences?.currentProject]);

  return { pivotWords, refetch: () => {
      setInitializeIndices(true)
    }};
};
