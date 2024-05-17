import React from 'react';
import { Meta } from '@storybook/react';
import { ZodErrorDisplay, ZodErrorDisplayProps } from './zodErrorDisplay';
import {
  AlignmentFile,
  AlignmentFileSchema,
  alignmentFileSchemaErrorMessageMapper,
  AlignmentRecord,
  AlignmentRecordSchema
} from '../structs/alignmentFile';
import uuid from 'uuid-random';

const meta: Meta<typeof ZodErrorDisplay> = {
  title: 'ZodErrorDisplay',
  component: ZodErrorDisplay
};

export default meta;

export const Default = (props: ZodErrorDisplayProps) => (<ZodErrorDisplay {...props} />);
Default.args = {
  errors: AlignmentRecordSchema.safeParse({} as AlignmentRecord).error
} as ZodErrorDisplayProps;

export const MoreThan10Errors = (props: ZodErrorDisplayProps) => (<ZodErrorDisplay {...props} />);
MoreThan10Errors.args = {
  errors: AlignmentFileSchema.safeParse({
    records: [
      {},
      {},
      {},
      {},
      {},
      {}
    ] as AlignmentRecord[]
  } as AlignmentFile).error
} as ZodErrorDisplayProps;

export const WithCustomFieldNameMapper = (props: ZodErrorDisplayProps) => (<ZodErrorDisplay {...props} />);
WithCustomFieldNameMapper.args = {
  fieldNameMapper: alignmentFileSchemaErrorMessageMapper,
  errors: AlignmentFileSchema.safeParse({
    records: [
      {
        meta: {
          id: uuid()
        }
      },
      {},
      {},
      {},
      {},
      {}
    ] as AlignmentRecord[]
  } as AlignmentFile).error
} as ZodErrorDisplayProps;
