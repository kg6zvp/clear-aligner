import { Fragment } from 'react';

import Editor from './editor';
import { CorpusContainer } from 'structs';

import './styles.css';
import BCVWP from '../bcvwp/BCVWPSupport';

interface EditorWrapperProps {
  corpora: CorpusContainer[];
  currentPosition: BCVWP;
}

const EditorWrapper = (props: EditorWrapperProps): any => {
  return (
    <Fragment>
      <Editor containers={props.corpora} position={props.currentPosition} />
    </Fragment>
  );
};

export default EditorWrapper;
