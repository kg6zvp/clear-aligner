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

export interface AlignmentRecord {
  id: string;
  sources: string[];
  targets: string[];
}
