import React, { ReactElement } from 'react';
import { Card, Stack } from '@mui/material';

import useDebug from 'hooks/useDebug';
import LinkBuilderComponent from 'features/linkBuilder';
import { Corpus } from 'structs';

interface ContextPanelProps {
  corpora: Corpus[];
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  corpora,
}): ReactElement => {
  useDebug('ContextPanel');

  return (
    <Stack
      direction="row"
      spacing={2}
      style={{ height: '16rem' }}
      justifyContent="stretch"
      alignItems="stretch"
    >
      <Card
        elevation={6}
        key="a"
        style={{
          flexGrow: '1',
          flexBasis: '0',
        }}
      >
        <LinkBuilderComponent corpora={corpora} />
      </Card>
    </Stack>
  );
};

export default ContextPanel;
