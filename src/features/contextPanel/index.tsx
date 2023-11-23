import { ReactElement } from 'react';
import { Card, Stack } from '@mui/material';

import useDebug from 'hooks/useDebug';
import LinkBuilderComponent from 'features/linkBuilder';

export const ContextPanel = (): ReactElement => {
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
        <LinkBuilderComponent />
      </Card>
    </Stack>
  );
};

export default ContextPanel;
