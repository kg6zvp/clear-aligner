import { PivotWord } from './structs';
import { AlignmentSide } from '../../structs';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../../App';
import { WordsIndex } from '../../state/links/wordsIndex';
import { AppState } from 'state/databaseManagement';
import { useInterval } from 'usehooks-ts';
import { Project } from '../../state/projects/tableManager';

export const usePivotWords = (wordSource: AlignmentSide): PivotWord[] | undefined => {
  const { appState, setAppState } = useContext(AppContext);
  const {currentProject} = appState;
  const { sourceContainer, targetContainer } = {
    sourceContainer: appState.sourceCorpora,
    targetContainer: currentProject?.targetCorpora
  }

  const source = useMemo(() => wordSource === AlignmentSide.SOURCE ? currentProject?.linksIndexes?.sourcesIndex
    : currentProject?.linksIndexes?.targetsIndex, [wordSource, currentProject?.linksIndexes?.sourcesIndex, currentProject?.linksIndexes?.targetsIndex]);

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
      currentProject?.linksTable
      && currentProject?.linksIndexes
      && (currentProject?.linksTable.isSecondaryIndexRegistered(currentProject?.linksIndexes.sourcesIndex) || currentProject?.linksIndexes.sourcesIndex.isLoading())
      && (currentProject?.linksTable.isSecondaryIndexRegistered(currentProject?.linksIndexes.targetsIndex) || currentProject?.linksIndexes.targetsIndex.isLoading())) {
      // if indexes are already registered, no need to replace them
      return;
    }

    // cleanup old indexes if they are already there
    if (currentProject?.linksIndexes) {
      currentProject?.linksIndexes.sourcesIndex.indexingTasks.stop();
      currentProject?.linksIndexes.sourcesIndex.indexingTasks.clear();
      currentProject?.linksIndexes.targetsIndex.indexingTasks.stop();
      currentProject?.linksIndexes.targetsIndex.indexingTasks.clear();
    }

    // initialize
    const secondaryIndices = {
      sourcesIndex: new WordsIndex(sourceContainer, AlignmentSide.SOURCE),
      targetsIndex: new WordsIndex(targetContainer, AlignmentSide.TARGET)
    };

    setAppState((as: AppState) => ({
      ...as,
      currentProject: {
        ...(as.currentProject ?? {}),
        linksIndexes: secondaryIndices
      } as Project
    }));

    secondaryIndices.sourcesIndex.indexingTasks.enqueue(secondaryIndices.sourcesIndex.initialize);
    secondaryIndices.targetsIndex.indexingTasks.enqueue(secondaryIndices.targetsIndex.initialize);
    if (currentProject?.linksTable) {
      secondaryIndices.sourcesIndex.indexingTasks.enqueue(async () => await currentProject?.linksTable!.registerSecondaryIndex(secondaryIndices.sourcesIndex))
      secondaryIndices.targetsIndex.indexingTasks.enqueue(async () => await currentProject?.linksTable!.registerSecondaryIndex(secondaryIndices.targetsIndex))
    }
  }, [
    currentProject?.linksTable,
    currentProject?.linksIndexes,
    setAppState,
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
