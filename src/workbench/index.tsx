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
}

const Workbench: React.FC<WorkbenchProps> = ({
  corpora,
  currentPosition,
}: WorkbenchProps): ReactElement => {
  return (
    <>
      {corpora && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: 'auto',
              marginTop: '1rem',
              marginBottom: '0',
              minWidth: '100%',
              flexGrow: 1,
            }}
          >
            <Editor
              containers={corpora}
              position={currentPosition as BCVWP}
            />
          </div>
      )}
    </>
  );
};

export default Workbench;
