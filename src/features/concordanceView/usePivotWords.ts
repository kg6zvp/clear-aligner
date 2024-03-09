import { PivotWord } from './structs';
import { AlignmentSide, LanguageInfo } from '../../structs';
import { useEffect, useState } from 'react';
import { DefaultProjectName } from '../../state/links/tableManager';
import { useDatabase } from '../../hooks/useDatabase';
import { GridSortItem } from '@mui/x-data-grid';
import { PivotWordFilter } from './concordanceView';
import _ from 'lodash';

export const usePivotWords = (side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem|null): PivotWord[] | undefined => {
  const databaseApi = useDatabase();
  const [ pivotWords, setPivotWords ] = useState<PivotWord[]|undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      const pivotWordList = (await databaseApi.corporaGetPivotWords(DefaultProjectName, side, filter, sort));

      const languages = new Map<string, LanguageInfo>();

      const languageIds = _.uniqWith(pivotWordList.map(({ l }) => l), _.isEqual);
      const langs = await databaseApi.findByIds<LanguageInfo,string>(DefaultProjectName, 'language', languageIds);
      langs?.forEach((lang) => languages.set(lang.code, lang));

      setPivotWords(pivotWordList
        .map(({ t, c, l }): PivotWord => ({
          side,
          normalizedText: t,
          frequency: c,
          languageInfo: languages.get(l)!
        })));
    }

    void load();
  }, [side, filter, sort, setPivotWords, databaseApi]);


  return pivotWords;
};
