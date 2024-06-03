import React, { useState } from 'react';
import { Meta } from '@storybook/react';
import { AlignmentFile, AlignmentFileSchema, AlignmentRecord, AlignmentRecordSchema } from '../structs/alignmentFile';
import { ZodErrorDialogProps, ZodErrorDialog } from './zodErrorDialog';
import { Button } from '@mui/material';

const meta: Meta<typeof ZodErrorDialog> = {
  title: 'ZodErrorDialog',
  component: ZodErrorDialog
};

export default meta;

export const Default = (props: ZodErrorDialogProps) => {
  const [showDialog, setShowDialog] = useState<boolean>(false);

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>Open Dialog</Button>
      <ZodErrorDialog
        onDismissDialog={() => setShowDialog(false)}
        errors={props.errors}
        showDialog={showDialog} />
    </>);
};
Default.args = {
  errors: AlignmentRecordSchema.safeParse({
  } as AlignmentRecord).error,
} as ZodErrorDialogProps;

export const MoreThan10Errors = (props: ZodErrorDialogProps) => {
  const [showDialog, setShowDialog] = useState<boolean>(false);

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>Open Dialog</Button>
      <ZodErrorDialog
        onDismissDialog={() => setShowDialog(false)}
        errors={props.errors}
        showDialog={showDialog} />
    </>);
};
MoreThan10Errors.args = {
  errors: AlignmentFileSchema.safeParse({
    records: [
      {},
      {},
      {},
      {},
      {},
      {}
    ]  as AlignmentRecord[]
  } as AlignmentFile).error,
} as ZodErrorDialogProps;
