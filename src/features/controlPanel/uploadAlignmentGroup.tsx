/**
 * This file contains the UploadAlignment component which contains buttons used
 * in the Projects Mode for uploading and saving alignment data
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CorpusContainer } from '../../structs';
import { AlignmentFile, AlignmentFileSchema, alignmentFileSchemaErrorMessageMapper } from '../../structs/alignmentFile';
import { useGetAllLinks, useImportAlignmentFile } from '../../state/links/tableManager';
import { Button, ButtonGroup } from '@mui/material';
import { FileDownload, FileUpload, Sync } from '@mui/icons-material';
import uuid from 'uuid-random';
import saveAlignmentFile from '../../helpers/alignmentFile';
import { SafeParseReturnType, ZodError } from 'zod';
import { ZodErrorDialog } from '../../components/zodErrorDialog';
import { RemovableTooltip } from '../../components/removableTooltip';
import { SyncProgress, useSyncProject } from '../../api/projects/useSyncProject';
import { Project } from '../../state/projects/tableManager';
import { ProjectLocation } from '../../common/data/project/project';

const UploadAlignmentGroup = ({ project, containers, size, isCurrentProject, isSignedIn, disableProjectButtons }: {
  project?: Project,
  containers: CorpusContainer[],
  size?: string,
  isCurrentProject?: boolean;
  isSignedIn?: boolean;
  disableProjectButtons: boolean
}) => {
  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [alignmentFileSaveState, setAlignmentFileSaveState] = useState<{
    alignmentFile?: AlignmentFile,
    saveKey?: string,
    suppressJournaling?: boolean,
    removeAllFirst?: boolean,
    preserveFileIds?: boolean
  }>();

  const [alignmentFileErrors, setAlignmentFileErrors] = useState<{
    errors?: ZodError<AlignmentFile>,
    showDialog?: boolean
  }>();

  const dismissDialog = useCallback(() => setAlignmentFileErrors({}), [setAlignmentFileErrors]);

  useImportAlignmentFile(project?.id,
    alignmentFileSaveState?.alignmentFile,
    alignmentFileSaveState?.saveKey,
    false,
    alignmentFileSaveState?.suppressJournaling,
    alignmentFileSaveState?.removeAllFirst,
    alignmentFileSaveState?.preserveFileIds);
  const { sync: syncProject, progress, dialog, file: alignmentFileFromServer } = useSyncProject();
  const [getAllLinksKey, setGetAllLinksKey] = useState<string>();
  const { result: allLinks } = useGetAllLinks(project?.id, getAllLinksKey);

  useEffect(() => {
    saveAlignmentFile(allLinks);
  }, [allLinks]);
  useEffect(() => {
    if (!alignmentFileFromServer) {
      return;
    }
    // clear errors, if any
    setAlignmentFileErrors({
      errors: undefined,
      showDialog: undefined
    });
    // import/save file
    setAlignmentFileSaveState({
      alignmentFile: alignmentFileFromServer,
      saveKey: uuid(),
      suppressJournaling: true,
      removeAllFirst: true,
      preserveFileIds: true
    });
  }, [alignmentFileFromServer, setAlignmentFileSaveState]);

  const inProgress = useMemo(() => (
    [
      SyncProgress.IN_PROGRESS,
      SyncProgress.SYNCING_LOCAL,
      SyncProgress.SWITCH_TO_PROJECT,
      SyncProgress.SYNCING_PROJECT,
      SyncProgress.SYNCING_CORPORA,
      SyncProgress.SYNCING_ALIGNMENTS
    ].includes(progress)
  ), [progress]);

  const enableSyncButton = useMemo<boolean>(() => {
    if (!project) {
      return false;
    }
    if (disableProjectButtons) {
      return false;
    }
    if (!isSignedIn || containers.length < 1 || inProgress) {
      return false;
    }
    if ((project.updatedAt ?? 0) > (project.lastSyncTime ?? 0)) {
      return true;
    }
    if ((project.serverUpdatedAt ?? 0) > (project.lastSyncServerTime ?? 0)) {
      return true;
    }
    return [...(project.sourceCorpora?.corpora ?? []), ...(project.targetCorpora?.corpora ?? [])]
      .some((corpus) => !!corpus.updatedSinceSync);
  }, [project, disableProjectButtons, isSignedIn, containers, inProgress]);

  return (
    <span>
      {
        project?.location !== ProjectLocation.LOCAL && (
          <>
            <RemovableTooltip
              removed={alignmentFileErrors?.showDialog || disableProjectButtons}
              title={isSignedIn ? 'Sync Project' : 'Unable to sync projects while signed out'}
              describeChild
              arrow>
          <span>

                <Button
                  size={size as 'medium' | 'small' | undefined}
                  disabled={!enableSyncButton}
                  variant="contained"
                  sx={{
                    minWidth: '100%',
                    marginBottom: '.2em'
                  }}
                  onClick={async () => {
                    project && syncProject(project);
                  }}
                >
                  <Sync sx={theme => ({
                    ...(inProgress ? {
                      '@keyframes rotation': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' }
                      },
                      animation: '2s linear infinite rotation reverse',
                      fill: inProgress ? theme.palette.text.secondary : 'white'
                    } : {})
                  })} />
                </Button>
          </span>
            </RemovableTooltip>
            <br />
          </>
        )}
      <ButtonGroup
        disabled={disableProjectButtons}
      >
        <RemovableTooltip
          removed={alignmentFileErrors?.showDialog || disableProjectButtons}
          title="Load Alignment Data"
          describeChild
          arrow>
            <span>
              <ZodErrorDialog
                showDialog={alignmentFileErrors?.showDialog}
                fieldNameMapper={alignmentFileSchemaErrorMessageMapper}
                errors={alignmentFileErrors?.errors}
                onDismissDialog={dismissDialog}
              />
              <input
                type="file"
                hidden
                ref={fileInputRef}
                multiple={false}
                onClick={(event) => {
                  // this is a fix which allows loading a file of the same path and filename. Otherwise the onChange
                  // event isn't thrown.

                  // @ts-ignore
                  event.currentTarget.value = null;
                }}
                onChange={async (event) => {
                  // grab file content
                  const file = event!.target!.files![0];
                  const content = await file.text();

                  const fileData = AlignmentFileSchema.safeParse(JSON.parse(content)) as SafeParseReturnType<AlignmentFile, AlignmentFile>;

                  setAlignmentFileErrors(fileData.success ? {} : {
                    errors: fileData.error,
                    showDialog: true
                  });

                  setAlignmentFileSaveState({
                    alignmentFile: fileData.success ? fileData.data : undefined,
                    saveKey: uuid(),
                    suppressJournaling: false,
                    removeAllFirst: false,
                    preserveFileIds: false
                  });
                }}
              />
              <Button
                size={size as 'medium' | 'small' | undefined}
                disabled={containers.length === 0 || !isCurrentProject || inProgress}
                variant="contained"
                onClick={() => {
                  // delegate file loading to regular file input
                  fileInputRef?.current?.click();
                }}
              >
                <FileUpload />
              </Button>
            </span>
          </RemovableTooltip>

        <RemovableTooltip
          removed={alignmentFileErrors?.showDialog || disableProjectButtons}
          title="Save Alignment Data"
          describeChild
          arrow>
            <span>
              <Button
                size={size as 'medium' | 'small' | undefined}
                disabled={containers.length === 0 || inProgress}
                variant="contained"
                onClick={() => new Promise<undefined>((resolve) => {
                  setTimeout(async () => {
                    setGetAllLinksKey(String(Date.now()));
                    resolve(undefined);
                  }, 20);
                })}
              >
                <FileDownload />
              </Button>
            </span>
        </RemovableTooltip>
      </ButtonGroup>
      {dialog}
    </span>
  );
};

export default UploadAlignmentGroup;
