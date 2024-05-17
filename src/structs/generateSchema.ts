import { AlignmentFileSchema, AlignmentRecordSchema, RecordMetadataSchema } from './alignmentFile';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fs from 'fs';
import { LinkOriginSchema, LinkStatusSchema } from './index';

/**
 * This script is invoked by the schemas:generate script in `package.json` and
 * is intended to be used to generate json schemas for any file formats other
 * programs may need to use to interchange data with ClearAligner
 */

const SCHEMA_OUTPUT_DIR = 'dist/schemas';

const alignmentFileSchemaObject = zodToJsonSchema(AlignmentFileSchema, {
  name: 'AlignmentFileSchema',
  definitions: {
    AlignmentRecordSchema,
    RecordMetadataSchema,
    LinkStatusSchema,
    LinkOriginSchema
  }
});

fs.mkdirSync(SCHEMA_OUTPUT_DIR, { recursive: true });
fs.writeFileSync(`${SCHEMA_OUTPUT_DIR}/AlignmentFileSchema.json`, JSON.stringify(alignmentFileSchemaObject, null, 2));
