import React, { ReactElement } from 'react';
import { CorpusContainer } from 'structs';
import EditorWrapper from 'features/editor';
import BCVWP from '../features/bcvwp/BCVWPSupport';

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
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2rem',
              border: '1px solid',
              margin: 'auto',
              marginTop: '1rem',
              marginBottom: '1rem',
              maxWidth: '1200px',
            }}
          >
            <EditorWrapper
              corpora={corpora}
              currentPosition={currentPosition as BCVWP}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Workbench;
