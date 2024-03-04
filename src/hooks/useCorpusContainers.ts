import { CorpusContainer } from '../structs';
import { getAvailableCorporaContainers } from '../workbench/query';
import { useEffect, useState } from 'react';

interface Containers {
  sourceContainer?: CorpusContainer;
  targetContainer?: CorpusContainer;
}

export const useCorpusContainers = (): Containers => {
  const [sourceContainer, setSourceContainer] = useState(
    undefined as CorpusContainer | undefined
  );
  const [targetContainer, setTargetContainer] = useState(
    undefined as CorpusContainer | undefined
  );

  useEffect(() => {
    const loadCorpora = async () => {
      const containers: CorpusContainer[] =
        await getAvailableCorporaContainers();

      containers.forEach((container) => {
        if (container.id === 'source') {
          setSourceContainer(container);
        } else if (container.id === 'target') {
          setTargetContainer(container);
        }
      });
    };

    if (sourceContainer && targetContainer) {
      return;
    }
    void loadCorpora();
  }, [ sourceContainer, setSourceContainer, targetContainer, setTargetContainer]);

  return {
    sourceContainer,
    targetContainer
  };
};
