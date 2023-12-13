import React, { ReactElement } from 'react';

import { Corpus } from 'structs';

import EditorWrapper from 'features/editor';

import BCVWP from '../features/bcvwp/BCVWPSupport';

interface WorkbenchProps {}

interface WorkbenchProps {
  corpora?: Corpus[];
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
              alignments={[
                // TODO revert to default
                {
                  source: 'sbl-gnt',
                  target: 'na27-YLT',
                  links: [
                    {
                      _id: 'sbl-gnt-na27-YLT-0',
                      sources: ['45005003002'],
                      targets: [
                        '45005003001',
                        '45005003003',
                        '45005003008',
                        '45005003009',
                        '45005003010',
                      ],
                    },
                    {
                      _id: 'sbl-gnt-na27-YLT-1',
                      sources: ['45005003013', '45005003014'],
                      targets: ['45005003019'],
                    },
                  ],
                  polarity: {
                    type: 'primary',
                    syntaxSide: 'sources',
                    nonSyntaxSide: 'targets',
                  },
                },
              ]}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Workbench;
