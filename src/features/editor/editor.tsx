import { ReactElement, useEffect } from 'react';
import { Container } from '@mui/material';

import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';

import Polyglot from 'features/polyglot';
import ControlPanel from 'features/controlPanel';
import ContextPanel from 'features/contextPanel';

import { CorpusContainer } from 'structs';

import '../../styles/theme.css';
import { loadAlignments } from '../../state/alignment.slice';
import BCVWP from '../bcvwp/BCVWPSupport';

interface EditorProps {
  containers: CorpusContainer[];
  position: BCVWP;
}

const Editor = (props: EditorProps): ReactElement => {
  useDebug('Editor');
  const dispatch = useAppDispatch();

  // handle the initialization of alignment data if it hasn't been set yet
  const alignmentState = useAppSelector((state) => {
    const alignments = state.alignment.present.alignments;
    return alignments;
  });

  useEffect(() => {
    if (alignmentState == null || alignmentState.length <= 0) {
      dispatch(
        loadAlignments([
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
          {
            source: 'wlc-hebot',
            target: 'wlc-ylt',
            links: [],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            },
          },
        ])
      );
    }
  }, [dispatch, alignmentState]);

  return (
    <Container maxWidth={false}>
      <Polyglot containers={props.containers} position={props.position} />
      <ControlPanel containers={props.containers} />
      <ContextPanel containers={props.containers} />
    </Container>
  );
};

export default Editor;
