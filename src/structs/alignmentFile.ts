import { LinkMetadata, LinkOriginSchema, LinkStatusSchema } from './index';
import { z } from 'zod';

/**
 * Metadata saved in alignment json files
 */
export interface RecordMetadata extends LinkMetadata {
  id: string;
}

/**
 * Zod schema for {@link RecordMetadata}
 */
export const RecordMetadataSchema = z.object({
  id: z.string(),
  origin: LinkOriginSchema,
  status: LinkStatusSchema
});

/**
 * Alignment link for reading from/writing to alignment json files
 */
export interface AlignmentRecord {
  meta: RecordMetadata;
  source: string[];
  target: string[];
}

/**
 * Zod schema for {@link AlignmentRecord}
 */
export const AlignmentRecordSchema = z.object({
  meta: RecordMetadataSchema,
  source: z.array(z.string()),
  target: z.array(z.string())
});

/**
 * The model representation of the Alignment data file.
 */
export interface AlignmentFile {
  type: string;
  meta: {
    creator: string;
  };
  records: AlignmentRecord[];
}

/**
 * Zod schema for {@link AlignmentFile}
 */
export const AlignmentFileSchema = z.object({
  type: z.string().optional(),
  meta: z.object({
    creator: z.string().optional()
  }),
  records: z.array(AlignmentRecordSchema, {
    message: 'alignment must contain records'
  })
});
