import React, { ReactElement, useContext } from 'react';
import { Container, Grid, Typography } from '@mui/material';

import useDebug from 'hooks/useDebug';

import Polyglot from 'features/polyglot';
import ControlPanel from 'features/controlPanel';
import ContextPanel from 'features/contextPanel';

import { CorpusContainer } from 'structs';

import '../../styles/theme.css';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AppContext } from '../../App';

interface EditorProps {
  containers: CorpusContainer[];
  position: BCVWP;
}

const Editor = (props: EditorProps): ReactElement => {
  useDebug('Editor');
  const {appState: {currentProject}} = useContext(AppContext);

  return (
    <Container maxWidth={false}>
      {
        currentProject || !props.containers.length ? (
          <>
            <Polyglot containers={props.containers} position={props.position} />
            <ControlPanel containers={props.containers} position={props.position} />
            <ContextPanel containers={props.containers} />
          </>
        ) : (
          <Grid container justifyContent="center" alignItems="center" sx={{height: 500}}>
            <Typography variant="subtitle1">A project must be selected to use the alignment view</Typography>
          </Grid>
        )
      }
    </Container>
  );
};

export default Editor;
