import React from 'react';
import { Meta } from '@storybook/react';
import { ZodErrorDisplay, ZodErrorDisplayProps } from './zodErrorDisplay';
import { AlignmentRecord, AlignmentRecordSchema } from '../structs/alignmentFile';

const meta: Meta<typeof ZodErrorDisplay> = {
  title: 'ZodErrorDisplay',
  component: ZodErrorDisplay
};

export default meta;

export const Default = (props: ZodErrorDisplayProps) => (<ZodErrorDisplay {...props} />);
Default.args = {
  errors: AlignmentRecordSchema.safeParse({
  } as AlignmentRecord).error
} as ZodErrorDisplayProps;
