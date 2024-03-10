import { AlignmentSide, LanguageInfo, Link } from '../structs';
import { PivotWordFilter } from '../features/concordanceView/concordanceView';
import { GridSortItem } from '@mui/x-data-grid';
import { useContext, useMemo } from 'react';
import { AppContext } from '../App';

export interface DatabaseApi {
  corporaGetPivotWords: (sourceName: string, side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null) => Promise<{
    t: string, // normalized text
    l: string, // language id
    c: number  // frequency
  }[]>;
  corporaGetAlignedWordsByPivotWord: (sourceName: string, side: AlignmentSide, normalizedText: string, sort?: GridSortItem | null) => Promise<{
    t: string, // normalized text (pivot word)
    sl: string, // sources text language id
    st: string, // sources text
    tl: string, // targets text language id
    tt: string, // targets text
    c: number // frequency
  }[]>;
  corporaGetLinksByAlignedWord: (sourceName: string, sourcesText: string, targetsText: string, sort?: GridSortItem | null) => Promise<Link[]>;
  findByIds: <T,K>(sourceName: string, table: string, ids: K[]) => Promise<T[]|undefined>;
  languageGetAll: (sourceName: string) => Promise<LanguageInfo[]>;
  languageFindByIds: (sourceName: string, languageIds: string[]) => Promise<LanguageInfo[]>;
}

export const useDatabase = (): DatabaseApi => {
  const { projectState: { linksTable } } = useContext(AppContext);
  // @ts-ignore
  const dbDelegate = useMemo(() => window.databaseApi, []);
  const db: DatabaseApi = useMemo(() => ({
      corporaGetPivotWords: dbDelegate.corporaGetPivotWords,
      corporaGetAlignedWordsByPivotWord: dbDelegate.corporaGetAlignedWordsByPivotWord,
      corporaGetLinksByAlignedWord: async (sourceName: string, sourcesText: string, targetsText: string, sort?: GridSortItem | null): Promise<Link[]> => {
        const linkIds = await dbDelegate.corporaGetLinkIdsByAlignedWord(sourceName, sourcesText, targetsText, sort);
        return await dbDelegate.findByIds(sourceName, 'links', linkIds);
      },
      findByIds: dbDelegate.findByIds,
      languageGetAll: dbDelegate.languageGetAll,
      languageFindByIds: dbDelegate.languageFindByIds
    }), [linksTable]);
  return db;
}
