import {  Fragment } from 'react';

import Editor from './editor';
import Themed from 'features/themed';
import { Alignment } from 'structs';

import './styles.css';

interface EditorWrapperProps {
  alignments: Alignment[];
  theme: 'night' | 'day';
  alignmentUpdated?: Function;
  bcvId: string;
}

const EditorWrapper = (props: EditorWrapperProps): any => {
  const { theme } = props;

  return (
    <Themed theme={theme}>
      <Fragment>
          <Editor
            alignments={props.alignments}
            theme={props.theme}
            alignmentUpdated={() => props.alignmentUpdated?.()}
            bcvId={props.bcvId}
          />
      </Fragment>
    </Themed>
  );
};

export default EditorWrapper;
