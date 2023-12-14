import { Fragment } from 'react';

import { Provider } from 'react-redux';
import { store } from 'app/store';

import Editor from './editor';
import { Alignment, Corpus } from 'structs';

import './styles.css';
import BCVWP from '../bcvwp/BCVWPSupport';

interface EditorWrapperProps {
  corpora: Corpus[];
  currentPosition: BCVWP;
  alignments: Alignment[];
}

const EditorWrapper = (props: EditorWrapperProps): any => {
  return (
    <Fragment>
      <Provider store={store}>
        <Editor
          corpora={props.corpora}
          alignments={props.alignments}
          currentPosition={props.currentPosition}
        />
      </Provider>
    </Fragment>
  );
};

export default EditorWrapper;
