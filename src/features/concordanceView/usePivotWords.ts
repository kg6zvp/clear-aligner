import { PivotWord } from './structs';
import { AlignmentSide } from '../../structs';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../../App';
import { WordsIndex } from '../../state/links/wordsIndex';

export const usePivotWords = (wordSource: AlignmentSide): PivotWord[] | undefined => {
  const { projectState, setProjectState } = useContext(AppContext);
  const { sourceContainer, targetContainer } = useCorpusContainers();

  const source = useMemo(() => wordSource === 'sources' ? projectState.linksIndexes?.sourcesIndex
    : projectState.linksIndexes?.targetsIndex, [wordSource, projectState.linksIndexes?.sourcesIndex, projectState.linksIndexes?.targetsIndex]);

  const [ loading, setLoading ] = useState<boolean>(!!source?.loading);

  useEffect(() => {
    setLoading(!!source?.isLoading());

    if (!loading || !source) return;

    const waitForLoad = async () => {
      await source.waitForTasksToFinish();
      setLoading(false);
    }

    void waitForLoad();
  }, [source, loading, setLoading]);

  useEffect(() => {
    if (projectState.linksIndexes || !sourceContainer || !targetContainer) {
      return;
    }
    // initialize

    const secondaryIndices = {
      sourcesIndex: new WordsIndex(sourceContainer, 'sources'),
      targetsIndex: new WordsIndex(targetContainer, 'targets')
    };

    setProjectState({
      ...projectState,
      linksIndexes: secondaryIndices
    });

    secondaryIndices.sourcesIndex.indexingTasks.enqueue(secondaryIndices.sourcesIndex.initialize);
    secondaryIndices.targetsIndex.indexingTasks.enqueue(secondaryIndices.targetsIndex.initialize);
  }, [
    projectState,
    projectState.linksIndexes,
    setProjectState,
    sourceContainer,
    targetContainer
  ]);

  const pivotWords = useMemo<PivotWord[] | undefined>(() => {
    if (!source || loading) {
      return undefined;
    }
    return source.getPivotWords();
  }, [
    source,
    loading
    ]);

  return pivotWords;
};
