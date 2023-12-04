import React, {ReactElement} from 'react';

import {Corpus, SyntaxType} from 'structs';

import EditorWrapper from 'features/editor';

import fetchSyntaxData from 'workbench/fetchSyntaxData';

import {queryText} from 'workbench/query';
import BCVWP from "../BCVWP/BCVWPSupport";

interface WorkbenchProps {
  corpora?: Corpus[];
  currentPosition?: BCVWP | null;
}

const Workbench: React.FC<WorkbenchProps> = ({corpora, currentPosition}: WorkbenchProps): ReactElement => {
  const [displayCorpora, setDisplayCorpora] = React.useState([] as Corpus[]);

  return (<>
    {corpora &&
      (<div>
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
            alignments={[
              {
                source: 'sbl-gnt',
                target: 'na27-YLT',
                links: [],
                polarity: {
                  type: 'primary',
                  syntaxSide: 'sources',
                  nonSyntaxSide: 'targets',
                },
              },
            ]}
          />
        </div>
      </div>)}
  </>);
};

export default Workbench;
