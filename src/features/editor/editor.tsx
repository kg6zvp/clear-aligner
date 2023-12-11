import { ReactElement, useEffect } from 'react';
import { Container } from '@mui/material';

import useDebug from 'hooks/useDebug';
import { useAppDispatch } from 'app/hooks';

import Polyglot from 'features/polyglot';
import ControlPanel from 'features/controlPanel';
import ContextPanel from 'features/contextPanel';

import { Alignment, Corpus } from 'structs';

import '../../styles/theme.css';
import { loadAlignments } from '../../state/alignment.slice';
import BCVWP from '../bcvwp/BCVWPSupport';

interface EditorProps {
  corpora: Corpus[];
  currentPosition: BCVWP;
  alignments: Alignment[];
  alignmentUpdated: Function;
}

const Editor = (props: EditorProps): ReactElement => {
  const { alignments, alignmentUpdated } = props;
  useDebug('Editor');

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadAlignments(alignments));
  }, [dispatch, alignments]);

  return (
    <Container maxWidth={false}>
      <Polyglot corpora={props.corpora} />
      <ControlPanel
        alignmentUpdated={alignmentUpdated}
        corpora={props.corpora}
      />
      <ContextPanel corpora={props.corpora} />
    </Container>
  );
};

export default Editor;
