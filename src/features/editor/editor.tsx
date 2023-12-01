import {ReactElement, useEffect, useState} from 'react';
import { Container } from '@mui/material';

import useDebug from 'hooks/useDebug';
import {useAppDispatch} from 'app/hooks';
import { setTheme } from 'state/app.slice';

import Polyglot from 'features/polyglot';
import ControlPanel from 'features/controlPanel';
import ContextPanel from 'features/contextPanel';

import {Alignment, Corpus} from 'structs';

import '../../styles/theme.css';
import {loadAlignments} from "../../state/alignment.slice";
import {queryText} from "../../workbench/query";

interface EditorProps {
  alignments: Alignment[];
  theme: 'night' | 'day';
  alignmentUpdated: Function;
  bcvId: string
}

export const Editor = (props: EditorProps): ReactElement => {
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const { alignments, theme, alignmentUpdated, bcvId } = props;
  useDebug('Editor');

  const dispatch = useAppDispatch();

  useEffect(() => {
    queryText().then(setCorpora);
    dispatch(loadAlignments(alignments));
    dispatch(setTheme(theme));
  }, [dispatch, theme, alignments]);

  return (
    <Container maxWidth={false}>
      <Polyglot bcvId={bcvId} corpora={corpora}/>
      <ControlPanel alignmentUpdated={alignmentUpdated} corpora={corpora} />
      <ContextPanel corpora={corpora} />
    </Container>
  );
};

export default Editor;
