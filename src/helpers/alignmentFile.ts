/**
 * This file contains the saveAlignmentFile function that's called in the
 * Projects Mode to save alignment data.
 */
import { AlignmentFile, AlignmentRecord } from '../structs/alignmentFile';
import { Link, LinkStatus } from '../structs';


export const saveAlignmentFile = (links: Link[] | undefined) => {
  if (!links) return;
  // create starting instance
  const alignmentExport: AlignmentFile = {
    type: 'translation',
    meta: {
      creator: 'ClearAligner'
    },
    records: links
      .filter(Boolean)
      .filter(link => link.id)
      .map(
        (link): AlignmentRecord =>
          ({
            meta: {
              id: link.id,
              ...link.metadata
            },
            source: (link.sources ?? []),
            target: (link.targets ?? [])
          } as AlignmentRecord) ?? []
      )
  };

  // Create alignment file content
  const fileContent = JSON.stringify(
    alignmentExport,
    undefined,
    2
  );

  // Create a Blob from the data
  const blob = new Blob([fileContent], {
    type: 'application/json'
  });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a link element
  const link = document.createElement('a');
  const currentDate = new Date();

  // Set the download attribute and file name
  link.download = `alignment_data_${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(
    2,
    '0'
  )}T${String(currentDate.getHours()).padStart(2, '0')}_${String(
    currentDate.getMinutes()
  ).padStart(2, '0')}.json`;

  // Set the href attribute to the generated URL
  link.href = url;

  // Append the link to the document
  document.body.appendChild(link);

  // Trigger a click event on the link
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);

  // Revoke the URL to free up resources
  URL.revokeObjectURL(url);
};

export interface AlignmentFileCheckResults {
  maxErrorMessages: number,
  isFileValid: boolean;
  errorMessages: string[];
  submittedLinks: number,
  acceptedLinks: number,
  rejectedLinks: number,
  validatedFile?: AlignmentFile;
}

export const checkAlignmentFile = (inputFile: any, maxErrorMessages = 100): AlignmentFileCheckResults => {
  let isFileValid = true;
  let errorMessages: string[] = [];
  let submittedLinks = 0;
  let acceptedLinks = 0;
  let rejectedLinks = 0;
  const validatedFile: AlignmentFile = {
    type: inputFile?.type ?? '',
    meta: inputFile?.meta ?? {
      creator: ''
    },
    records: []
  };
  if (Array.isArray(inputFile?.records)) {
    const linkArray = (inputFile?.records as any[]);
    submittedLinks = linkArray.length;
    linkArray.forEach((arrayEntry, entryIndex) => {
      const linkNum = (entryIndex + 1);
      const possibleRecord = arrayEntry as AlignmentRecord | undefined;
      const possibleOrigin = (possibleRecord?.meta?.origin as string | undefined);
      let isLinkValid = true;
      if (!possibleOrigin) {
        isLinkValid = false;
        errorMessages.length < maxErrorMessages
        && errorMessages.push(`Link #${linkNum.toLocaleString()} has no origin (missing/empty "meta.origin" field).`);
      }
      const possibleStatus = (possibleRecord?.meta?.status as string | undefined);
      if (!possibleStatus || !((possibleStatus ?? '').toUpperCase() in LinkStatus)) {
        isLinkValid = false;
        errorMessages.length < maxErrorMessages
        && errorMessages.push(`Link #${linkNum.toLocaleString()} has no valid status (missing/invalid "meta.status" field).`);
      }
      const possibleSource = (possibleRecord?.source as string[] | undefined);
      if (!possibleSource || (possibleSource?.length ?? 0) < 1) {
        isLinkValid = false;
        errorMessages.length < maxErrorMessages
        && errorMessages.push(`Link #${linkNum.toLocaleString()} has no source tokens (missing/empty "source" field).`);
      }
      const possibleTarget = (possibleRecord?.target as string[] | undefined);
      if (!possibleTarget || (possibleTarget?.length ?? 0) < 1) {
        isLinkValid = false;
        errorMessages.length < maxErrorMessages
        && errorMessages.push(`Link #${linkNum.toLocaleString()} has no target tokens (missing/empty "target" field).`);
      }
      if (isLinkValid) {
        validatedFile.records.push(possibleRecord as AlignmentRecord);
        acceptedLinks++;
      } else {
        isFileValid = false;
        rejectedLinks++;
      }
    });
  } else {
    isFileValid = false;
    errorMessages.length < maxErrorMessages
    && errorMessages.push('Input file has no alignment links (missing/empty "records" field).');
  }
  return {
    maxErrorMessages,
    isFileValid,
    errorMessages,
    submittedLinks,
    acceptedLinks,
    rejectedLinks,
    validatedFile
  };
};
