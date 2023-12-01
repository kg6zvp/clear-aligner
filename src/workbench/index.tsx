import React, {ReactElement} from 'react';

import {Corpus, SyntaxType} from 'structs';

import EditorWrapper from 'features/editor';

import fetchSyntaxData from 'workbench/fetchSyntaxData';

import {queryText} from 'workbench/query';
import BCVWP from "../BCVWP/BCVWPSupport";

interface WorkbenchProps {}

interface WorkbenchProps {
  corpora?: Corpus[];
  currentPosition?: BCVWP | null;
}

const Workbench: React.FC<WorkbenchProps> = ({corpora, currentPosition}: WorkbenchProps): ReactElement => {
  const [showSourceText] = React.useState(true);
  const [showTargetText] = React.useState(true);
  const [showLwcText] = React.useState(true);
  const [showBackText] = React.useState(true);

  const [displayCorpora, setDisplayCorpora] = React.useState([] as Corpus[]);

  React.useEffect(() => {
    if (showSourceText) {
      queryText('sbl', currentPosition)
        .then(async (corpus) => {
          if (corpus) {
            const syntaxData = await fetchSyntaxData(currentPosition);
            const sourceCorpus: Corpus = {
              ...corpus,
              syntax: {...syntaxData!, _syntaxType: SyntaxType.Source}
            };
            setDisplayCorpora([...displayCorpora, sourceCorpus]);
          }
        });
    }
  }, [showSourceText, displayCorpora, setDisplayCorpora, currentPosition]);
  React.useEffect(() => {
    if (showTargetText) {
      queryText('nvi', currentPosition)
        .then(async (corpus) => {
          if (corpus) {
            const syntaxData = await fetchSyntaxData(currentPosition);
            const targetCorpus: Corpus = {
              ...corpus,
              syntax: {...syntaxData!, _syntaxType: SyntaxType.Mapped},
            };
            setDisplayCorpora([...displayCorpora, targetCorpus]);
          }
        });
    }
  }, [showTargetText, displayCorpora, setDisplayCorpora, currentPosition]);
  React.useEffect(() => {
    if (showLwcText) {
      queryText('leb', currentPosition)
        .then(async (corpus) => {
          if (corpus) {
            const syntaxData = await fetchSyntaxData(currentPosition);
            const lwcCorpus: Corpus = {
              ...corpus,
              syntax: {...syntaxData!, _syntaxType: SyntaxType.MappedSecondary},
            }
            setDisplayCorpora([...displayCorpora, lwcCorpus]);
          }
        });
    }
  }, [showLwcText, displayCorpora, setDisplayCorpora, currentPosition])

  React.useEffect(() => {
    if (showBackText) {
      queryText('backTrans', currentPosition)
        .then(async (corpus) => {
          if (corpus) {
            setDisplayCorpora([...displayCorpora, corpus]);
          }
        });
    }
  }, [showBackText, displayCorpora, setDisplayCorpora, currentPosition]);

  return (
    <>
    {corpora &&
      (
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
      </div>
      )}
  </>
  );
};

export default Workbench;
