import { Fragment } from 'react';

import Editor from './editor';
import { Corpus } from 'structs';

import './styles.css';
import BCVWP from '../bcvwp/BCVWPSupport';

interface EditorWrapperProps {
  corpora: Corpus[];
  currentPosition: BCVWP;
}

const EditorWrapper = (props: EditorWrapperProps): any => {
  return (
    <Fragment>
      <Editor corpora={props.corpora} currentPosition={props.currentPosition} />
    </Fragment>
  );
};

export default EditorWrapper;
