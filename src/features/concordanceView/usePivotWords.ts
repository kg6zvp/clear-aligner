import { PivotWord } from './structs';
import { AlignmentSide } from '../../structs';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../../App';
import { WordsIndex } from '../../state/links/wordsIndex';
import { ProjectState } from 'state/databaseManagement';
import { useInterval } from 'usehooks-ts';

export const usePivotWords = (wordSource: AlignmentSide): {
  pivotWords: PivotWord[] | undefined;
  refetch: () => void;
} => {
  const { projectState, setProjectState } = useContext(AppContext);
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const [initializeIndices, setInitializeIndices] = useState(false);

  const source = useMemo(() => wordSource === AlignmentSide.SOURCE ? projectState.linksIndexes?.sourcesIndex
    : projectState.linksIndexes?.targetsIndex, [wordSource, projectState.linksIndexes?.sourcesIndex, projectState.linksIndexes?.targetsIndex]);

  const [ loading, setLoading ] = useState<boolean>(!!source?.loading);

  // when source is changed, set the loading state to match the new source
  useInterval(() => {
    if (loading !== !!source?.isLoading()) {
      setLoading(!!source?.isLoading()); // change the status to match the source
    }
  }, 500);

  // initialize indices if they don't exist or if linksTable changes
  useEffect(() => {
    if (!sourceContainer || !targetContainer) {
      return;
    }

    if (
      !initializeIndices
      && projectState.linksTable
      && projectState.linksIndexes
      && (projectState.linksTable.isSecondaryIndexRegistered(projectState.linksIndexes.sourcesIndex) || projectState.linksIndexes.sourcesIndex.isLoading())
      && (projectState.linksTable.isSecondaryIndexRegistered(projectState.linksIndexes.targetsIndex) || projectState.linksIndexes.targetsIndex.isLoading())) {
      // if indexes are already registered, no need to replace them
      return;
    }

    // cleanup old indexes if they are already there
    if (projectState.linksIndexes) {
      projectState.linksIndexes.sourcesIndex.indexingTasks.stop();
      projectState.linksIndexes.sourcesIndex.indexingTasks.clear();
      projectState.linksIndexes.targetsIndex.indexingTasks.stop();
      projectState.linksIndexes.targetsIndex.indexingTasks.clear();
    }

    // initialize
    const secondaryIndices = {
      sourcesIndex: new WordsIndex(sourceContainer, AlignmentSide.SOURCE),
      targetsIndex: new WordsIndex(targetContainer, AlignmentSide.TARGET)
    };

    setProjectState((ps: ProjectState) => ({
      ...ps,
      linksIndexes: secondaryIndices
    }));

    secondaryIndices.sourcesIndex.indexingTasks.enqueue(secondaryIndices.sourcesIndex.initialize);
    secondaryIndices.targetsIndex.indexingTasks.enqueue(secondaryIndices.targetsIndex.initialize);
    if (projectState.linksTable) {
      secondaryIndices.sourcesIndex.indexingTasks.enqueue(async () => await projectState.linksTable!.registerSecondaryIndex(secondaryIndices.sourcesIndex))
      secondaryIndices.targetsIndex.indexingTasks.enqueue(async () => await projectState.linksTable!.registerSecondaryIndex(secondaryIndices.targetsIndex))
    }
    setInitializeIndices(false);
  }, [
    projectState.linksTable,
    projectState.linksIndexes,
    setProjectState,
    sourceContainer,
    targetContainer,
    initializeIndices
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

  return { pivotWords, refetch: () => {
      setInitializeIndices(true)
    }};
};
