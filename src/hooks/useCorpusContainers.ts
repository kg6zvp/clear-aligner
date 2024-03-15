import { AlignmentSide, CorpusContainer } from '../structs';
import { getAvailableCorporaContainers } from '../workbench/query';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';

export interface Containers {
  sourceContainer?: CorpusContainer;
  targetContainer?: CorpusContainer;
}

export const useCorpusContainers = (): Containers => {
  const appContextProps = useContext(AppContext);

  return appContextProps.containers;
};
