/**
 * This file contains the UploadAlignment component which contains buttons used
 * in the Projects Mode for uploading and saving alignment data
 */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { AppContext } from '../../App';
import { Project } from '../../state/projects/tableManager';
import { ProjectLocation } from '../../common/data/project/project';
import _ from 'lodash';

const UploadAlignmentGroup = ({ projectId, containers, size, allowImport, isSignedIn }: {
  projectId?: string,
  containers: CorpusContainer[],
  size?: string,
  allowImport?: boolean;
  isSignedIn?: boolean;
}) => {
  const { projectState} = useContext(AppContext);
  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [alignmentFileSaveState, setAlignmentFileSaveState] = useState<{
    alignmentFile?: AlignmentFile,
    saveKey?: string,
    suppressJournaling?: boolean
  }>();

  const [ alignmentFileErrors, setAlignmentFileErrors ] = useState<{
    errors?: ZodError<AlignmentFile>,
    showDialog?: boolean
  }>();

  const dismissDialog = useCallback(() => setAlignmentFileErrors({}), [setAlignmentFileErrors]);

  useImportAlignmentFile(projectId, alignmentFileSaveState?.alignmentFile, alignmentFileSaveState?.saveKey);
  const { sync: syncProject, progress, dialog, file } = useSyncProject();
  const [getAllLinksKey, setGetAllLinksKey] = useState<string>();
  const { result: allLinks } = useGetAllLinks(projectId, getAllLinksKey);

  useEffect(() => {
    saveAlignmentFile(allLinks);
  }, [allLinks]);
  useEffect(() => {
    if (!file) {
      return;
    }
    // clear errors, if any
    setAlignmentFileErrors({
      errors: undefined,
      showDialog: undefined
    });
    // import/save file
    setAlignmentFileSaveState({
      alignmentFile: file,
      saveKey: uuid(),
      suppressJournaling: true
    });
  }, [file, setAlignmentFileSaveState]);

  const inProgress = useMemo(() => (
    [
      SyncProgress.IN_PROGRESS,
      SyncProgress.SYNCING_LOCAL,
      SyncProgress.RETRIEVING_TOKENS,
      SyncProgress.SYNCING_PROJECT,
      SyncProgress.SYNCING_CORPORA,
      SyncProgress.SYNCING_ALIGNMENTS,
    ].includes(progress)
  ), [progress]);

  const [currentProject, setCurrentProject] = useState<Project>();
  useEffect(() => {
    projectState.projectTable?.getProjects?.()?.then?.(res => {
      setCurrentProject(Array.from(res?.values?.() ?? []).find(p => p.id === projectId))
    })?.catch?.(console.error);
  }, [projectState, projectId]);

  return (
    <span>
      {
        currentProject?.location !== ProjectLocation.LOCAL && (
        <>
          <RemovableTooltip
            removed={alignmentFileErrors?.showDialog}
            title={isSignedIn ? 'Sync Project' : 'Unable to sync projects while signed out'}
            describeChild
            arrow>
          <span>

                <Button
                  size={size as 'medium' | 'small' | undefined}
                  disabled={!isSignedIn || containers.length === 0 || !allowImport || inProgress
                    || (
                      !!currentProject?.lastSyncTime
                      && !!currentProject.updatedAt
                      && currentProject.lastSyncTime === currentProject.updatedAt
                      && (_.max([ ...(currentProject.sourceCorpora?.corpora ?? []), ...(currentProject.targetCorpora?.corpora ?? []) ]
                        .map((corpus) => corpus.updatedAt?.getTime())
                        .filter((v) => !!v)) ?? 0) < currentProject.lastSyncTime
                    )}
                  variant="contained"
                  sx={{
                    minWidth: '100%',
                    marginBottom: '.2em'
                  }}
                  onClick={async () => {
                    currentProject && syncProject(currentProject);
                  }}
                >
                  <Sync sx={theme => ({
                    ...(inProgress ? {
                      '@keyframes rotation': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                      animation: '2s linear infinite rotation reverse',
                      fill: inProgress ? theme.palette.text.secondary : 'white'
                    } : {})
                  })} />
                </Button>
          </span>
          </RemovableTooltip>
          <br/>
        </>
      )}
      <ButtonGroup>
        <RemovableTooltip
          removed={alignmentFileErrors?.showDialog}
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
                    saveKey: uuid()
                  });
                }}
              />
              <Button
                size={size as 'medium' | 'small' | undefined}
                disabled={containers.length === 0 || !allowImport || inProgress}
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
          removed={alignmentFileErrors?.showDialog}
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
