/**
 * This file contains the UploadAlignment component which contains buttons used
 * in the Projects Mode for uploading and saving alignment data
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CorpusContainer } from '../../structs';
import { AlignmentFile, AlignmentFileSchema } from '../../structs/alignmentFile';
import { useGetAllLinks, useImportAlignmentFile } from '../../state/links/tableManager';
import { Box, Button, ButtonGroup, Dialog, Tooltip, Typography } from '@mui/material';
import { FileDownload, FileUpload } from '@mui/icons-material';
import uuid from 'uuid-random';
import saveAlignmentFile from '../../helpers/alignmentFile';
import { SafeParseError, SafeParseReturnType, ZodError, ZodParsedType } from 'zod';
import { ZodErrorDisplay } from '../../components/zodErrorDisplay';
import { ZodErrorDialog } from '../../components/zodErrorDialog';


const UploadAlignmentGroup = ({ projectId, containers, size, allowImport }: {
  projectId?: string,
  containers: CorpusContainer[],
  size?: string,
  allowImport?: boolean;
}) => {
  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [alignmentFileSaveState, setAlignmentFileSaveState] = useState<{
    alignmentFile?: AlignmentFile,
    saveKey?: string
  }>();

  const [ alignmentFileErrors, setAlignmentFileErrors ] = useState<{
    errors?: ZodError<AlignmentFile>,
    showDialog?: boolean
  }>();

  const dismissDialog = useCallback(() => setAlignmentFileErrors({}), [setAlignmentFileErrors]);

  useImportAlignmentFile(projectId, alignmentFileSaveState?.alignmentFile, alignmentFileSaveState?.saveKey);
  const [ getAllLinksKey, setGetAllLinksKey ] = useState<string>();
  const { result: allLinks } = useGetAllLinks(projectId, getAllLinksKey);
  useEffect(() => {
    saveAlignmentFile(allLinks);
  }, [allLinks]);

  return (
    <ButtonGroup>
      <Tooltip title="Load Alignment Data" arrow describeChild>
          <span>
            <ZodErrorDialog
              showDialog={alignmentFileErrors?.showDialog}
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
              disabled={containers.length === 0 || !allowImport}
              variant="contained"
              onClick={() => {
                // delegate file loading to regular file input
                fileInputRef?.current?.click();
              }}
            >
              <FileUpload />
            </Button>
          </span>
      </Tooltip>

      <Tooltip title="Save Alignment Data" arrow describeChild>
          <span>
            <Button
              size={size as 'medium' | 'small' | undefined}
              disabled={containers.length === 0}
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
      </Tooltip>
    </ButtonGroup>
  );
};

export default UploadAlignmentGroup;
