import { AlignmentSide, LanguageInfo } from '../structs';
import { PivotWordFilter } from '../features/concordanceView/concordanceView';
import { GridSortItem } from '@mui/x-data-grid';

export interface DatabaseApi {
  corporaGetPivotWords: (sourceName: string, side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null) => Promise<{
    t: string, // normalized text
    l: string, // language id
    c: number  // frequency
  }[]>;
  findByIds: <T,K>(sourceName: string, table: string, ids: K[]) => Promise<T[]|undefined>;
}

export const useDatabase = (): DatabaseApi => {
  // @ts-ignore
  return window.databaseApi as DatabaseApi;
}
