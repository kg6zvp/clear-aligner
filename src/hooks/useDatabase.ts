import { AlignmentSide, LanguageInfo } from '../structs';
import { PivotWordFilter } from '../features/concordanceView/concordanceView';
import { GridSortItem } from '@mui/x-data-grid';

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
  findByIds: <T,K>(sourceName: string, table: string, ids: K[]) => Promise<T[]|undefined>;
  languageGetAll: (sourceName: string) => Promise<LanguageInfo[]>;
  languageFindByIds: (sourceName: string, languageIds: string[]) => Promise<LanguageInfo[]>;
}

export const useDatabase = (): DatabaseApi => {
  // @ts-ignore
  return window.databaseApi as DatabaseApi;
}
