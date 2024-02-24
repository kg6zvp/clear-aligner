import { CorpusContainer } from '../structs';
import { getAvailableCorporaContainers } from '../workbench/query';
import { useEffect, useState } from 'react';

interface Containers {
  sourceContainer?: CorpusContainer;
  targetContainer?: CorpusContainer;
}

export const useCorpusContainers = (): Containers => {
  const [sourceContainer, setSourceContainer] = useState(
    null as CorpusContainer | null
  );
  const [targetContainer, setTargetContainer] = useState(
    null as CorpusContainer | null
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

    void loadCorpora();
  }, [setSourceContainer, setTargetContainer]);

  return {
    sourceContainer: sourceContainer ?? undefined,
    targetContainer: targetContainer ?? undefined,
  };
};
