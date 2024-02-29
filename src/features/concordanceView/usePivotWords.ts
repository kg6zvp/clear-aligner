import { PivotWord } from './structs';
import { AlignmentSide } from '../../structs';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../../App';
import { WordsIndex } from '../../state/links/wordsIndex';

export const usePivotWords = (wordSource: AlignmentSide): PivotWord[] | undefined => {
  const { projectState, setProjectState } = useContext(AppContext);
  const { sourceContainer, targetContainer } = useCorpusContainers();

  const source = useMemo(() => wordSource === 'sources' ? projectState.linksIndexes?.sourcesIndex
    : projectState.linksIndexes?.targetsIndex, [wordSource, projectState, projectState.linksIndexes?.sourcesIndex, projectState.linksIndexes?.targetsIndex]);

  console.log('usePivotWords: containers', {
    sourceContainer,
    targetContainer,
  });

  console.log('source', source);

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

    console.log('initializing');
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
    if (!source || source.loading) {
      return undefined;
    }
    return source.getPivotWords();
  }, [
    source,
    source?.loading
    ]);

  return pivotWords;
};
