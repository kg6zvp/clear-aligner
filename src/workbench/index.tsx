/**
 * This file contains the WorkBench component which is used in the Alignment
 * Editor and wraps the Editor component.
 */
import React, { ReactElement } from 'react';
import { CorpusContainer } from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import Editor from '../features/editor';

interface WorkbenchProps {
  corpora?: CorpusContainer[];
  currentPosition?: BCVWP | null;
  usePaddingForEditorContainer?: boolean
}

const Workbench: React.FC<WorkbenchProps> = ({
  corpora,
  currentPosition, usePaddingForEditorContainer = true,
}: WorkbenchProps): ReactElement => {
  return (
    <>
      {corpora && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: 'auto',
              marginTop: '0',
              marginBottom: '0',
              minWidth: '100%',
              height: 'calc(100% - 64px)',
            }}
          >
            <Editor
              containers={corpora}
              position={currentPosition as BCVWP}
              usePaddingForEditorContainer={usePaddingForEditorContainer}
            />
          </div>
      )}
    </>
  );
};

export default Workbench;
