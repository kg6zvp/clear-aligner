import {  Fragment } from 'react';

import { Provider } from 'react-redux';
import { store } from 'app/store';

import Editor from './editor';
import { Alignment, Corpus } from 'structs';

import './styles.css';

interface EditorWrapperProps {
  corpora: Corpus[];
  alignments: Alignment[];
  alignmentUpdated?: Function;
}

const EditorWrapper = (props: EditorWrapperProps): any => {
  return (
      <Fragment>
        <Provider store={store}>
          <Editor
            corpora={props.corpora}
            alignments={props.alignments}
            alignmentUpdated={() => props.alignmentUpdated?.()}
          />
        </Provider>
      </Fragment>
  );
};

export default EditorWrapper;
