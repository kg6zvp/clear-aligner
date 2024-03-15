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
  const [sourceContainer, setSourceContainer] = useState(
    undefined as CorpusContainer | undefined
  );
  const [targetContainer, setTargetContainer] = useState(
    undefined as CorpusContainer | undefined
  );

  useEffect(() => {
    const loadCorpora = async () => {
      const containers: CorpusContainer[] =
        await getAvailableCorporaContainers(appContextProps);

      containers.forEach((container) => {
        if (container.id === AlignmentSide.SOURCE) {
          setSourceContainer(container);
        } else if (container.id === AlignmentSide.TARGET) {
          setTargetContainer(container);
        }
      });
    };

    void loadCorpora();
  }, [appContextProps, setSourceContainer, setTargetContainer]);

  return {
    sourceContainer,
    targetContainer
  };
};
