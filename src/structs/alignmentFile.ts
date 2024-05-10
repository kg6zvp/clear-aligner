import { LinkMetadata, LinkOrigin, LinkStatus } from './index';

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

export interface RecordMetadata extends LinkMetadata {
  id: string;
}

export interface AlignmentRecord {
  id: string;
  meta: RecordMetadata;
  source: string[];
  target: string[];
}
