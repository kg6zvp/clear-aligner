// import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
// import React, { useCallback, useRef, useState } from 'react';
// import { ServerAlignmentLinkDTO } from '../../common/data/serverAlignmentLinkDTO';
// import { generateJsonString } from '../../common/generateJsonString';
// import { useDatabase } from '../../hooks/useDatabase';
// import { JournalEntryTableName } from '../../state/links/tableManager';
// import { JournalEntryDTO, mapJournalEntryEntityToJournalEntryDTO } from '../../common/data/journalEntryDTO';
// import { SERVER_URL } from '../../common';
// import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
// import { Progress } from '../ApiModels';
//
// export interface SyncState {
//   file?: AlignmentFile;
//   progress: Progress;
//   sync: (projectId?: string, controller?: AbortController) => Promise<unknown>;
//   dialog: any;
// }
//
// const mapJournalEntryEntityToJournalEntryDTOHelper = (journalEntry: any): JournalEntryDTO => mapJournalEntryEntityToJournalEntryDTO(journalEntry);
//
// /**
//  * hook to synchronize alignments. Updating the syncLinksKey or cancelSyncKey will perform that action as in our other hooks.
//  */
// export const useSyncAlignments = (): SyncState => {
//
//   const [progress, setProgress] = useState<Progress>(Progress.IDLE);
//   const [file, setFile] = useState<AlignmentFile | undefined>();
//   const abortController = useRef<AbortController | undefined>();
//   const dbApi = useDatabase();
//
//   const cleanupRequest = React.useCallback(() => {
//     setProgress(Progress.CANCELED);
//     abortController.current?.abort?.();
//   }, []);
//
//   const sendJournal = useCallback(async (signal: AbortSignal, alignmentProjectId?: string) => {
//     const journalEntries = (await dbApi.getAll(alignmentProjectId!, JournalEntryTableName))
//       .map(mapJournalEntryEntityToJournalEntryDTOHelper);
//     try {
//       await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${alignmentProjectId}/alignment_links/`, {
//         signal,
//         method: 'PATCH',
//         headers: {
//           accept: 'application/json',
//           'Content-Type': 'application/json'
//         },
//         body: generateJsonString(journalEntries)
//       });
//       await dbApi.deleteAll({
//         sourceName: alignmentProjectId!,
//         table: JournalEntryTableName
//       });
//     } catch (x) {
//       cleanupRequest();
//       throw new Error('Aborted');
//     }
//   }, []);
//
//   const fetchLinks = useCallback(async (signal: AbortSignal, alignmentProjectId?: string) => {
//     let response;
//     try {
//       response = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${alignmentProjectId}/alignment_links/`, {
//         signal,
//         headers: { accept: 'application/json' }
//       });
//     } catch (x) {
//       cleanupRequest();
//       throw new Error('Aborted');
//     }
//     const linksBody: {
//       links: ServerAlignmentLinkDTO[]
//     } = await response.json();
//     const tmpFile = {
//       type: 'translation',
//       meta: { creator: 'api' },
//       records: linksBody.links
//         .map(l => ({
//           meta: {
//             id: l.id,
//             origin: l.meta.origin,
//             status: l.meta.status
//           },
//           source: l.sources,
//           target: l.targets
//         } as AlignmentRecord))
//     };
//     setFile(tmpFile);
//     cleanupRequest();
//   }, []);
//
//   const syncLinks = useCallback(async (alignmentProjectId?: string, controller?: AbortController) => {
//     const signal = (controller ?? new AbortController()).signal;
//     try {
//       await sendJournal(signal, alignmentProjectId);
//       await fetchLinks(signal, alignmentProjectId);
//       return true;
//     } catch (x) {
//     }
//   }, []);
//
//   const dialog = React.useMemo(() => {
//     return (
//       <Dialog
//         scroll="paper"
//         open={![
//           Progress.IDLE,
//           Progress.SUCCESS,
//           Progress.FAILED,
//           Progress.CANCELED
//         ].includes(progress)}
//         onClose={cleanupRequest}
//       >
//         <Grid container alignItems="center" justifyContent="space-between"
//               sx={{ minWidth: 500, height: 'fit-content', p: 2 }}>
//           <CircularProgress sx={{ mr: 2, height: 10, width: 'auto' }} />
//           <Typography variant="subtitle1">
//             Syncing Alignments...
//           </Typography>
//           <Button variant="text" sx={{ textTransform: 'none', ml: 2 }} onClick={cleanupRequest}>Cancel</Button>
//         </Grid>
//       </Dialog>
//     );
//   }, [progress]);
//
//   return {
//     file,
//     progress,
//     sync: syncLinks,
//     dialog
//   };
// };
