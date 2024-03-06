import React, { useRef } from 'react';
import { Button, ButtonGroup, Tooltip } from '@mui/material';
import { VirtualTableLinks } from '../../state/links/tableManager';
import { WordsIndex } from '../../state/links/wordsIndex';
import { AlignmentSide, CorpusContainer, Link } from '../../structs';
import { AppState } from '../../state/databaseManagement';
import { Project } from '../../state/projects/tableManager';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import _ from 'lodash';
import { FileDownload, FileUpload } from '@mui/icons-material';
import { AppContext } from '../../App';

const UploadAlignmentGroup = ({containers, size}: {containers: CorpusContainer[], size?: string}) => {
  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {appState, setAppState} = React.useContext(AppContext);

  return (
    <>
      <ButtonGroup>
        <Tooltip title="Load Alignment Data" arrow describeChild>
          <span>
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
                const linksTable: VirtualTableLinks = new VirtualTableLinks();

                const sourceContainer = containers.find((container) => container.id === 'source')!;
                const targetContainer = containers.find((container) => container.id === 'target')!;

                const sourcesIndex = appState.currentProject?.linksIndexes?.sourcesIndex ?? new WordsIndex(sourceContainer, AlignmentSide.SOURCE);
                const targetsIndex = appState.currentProject?.linksIndexes?.targetsIndex ?? new WordsIndex(targetContainer, AlignmentSide.TARGET);

                const linksIndexes = {
                  sourcesIndex,
                  targetsIndex
                };

                linksIndexes.sourcesIndex.indexingTasks.enqueue(linksIndexes.sourcesIndex.initialize);
                linksIndexes.targetsIndex.indexingTasks.enqueue(linksIndexes.targetsIndex.initialize);

                setAppState((as: AppState) => ({
                  ...as,
                  currentProject: {
                    ...as.currentProject,
                    linksTable,
                    linksIndexes
                  } as Project
                }));

                // convert into an appropriate object
                const alignmentFile = JSON.parse(content) as AlignmentFile;

                const chunkSize = 10_000;
                // override the alignments from alignment file
                _.chunk(alignmentFile.records, chunkSize).forEach(
                  (chunk, chunkIdx) => {
                    const links = chunk.map((record, recordIdx): Link => {
                      return {
                        // @ts-ignore
                        id: record.id ?? record?.meta?.id ?? `record-${chunkIdx * chunkSize + (recordIdx + 1)}`,
                        sources: record.source,
                        targets: record.target,
                      };
                    });
                    try {
                      linksTable.saveAll(links, true);
                    } catch (e) {
                      console.error('e', e);
                    }
                  }
                );

                sourcesIndex.indexingTasks.enqueue(async () => {
                  await linksTable.registerSecondaryIndex(sourcesIndex);
                });

                targetsIndex.indexingTasks.enqueue(async () => {
                  await linksTable.registerSecondaryIndex(targetsIndex);
                });

                linksTable._onUpdate(); // modify variable to indicate that an update has occurred
              }}
            />
            <Button
              size={size as "medium" | "small" | undefined}
              disabled={containers.length === 0}
              variant="contained"
              onClick={e => {
                e.stopPropagation();
                // delegate file loading to regular file input
                fileInputRef?.current?.click();
              }}
            >
              <FileUpload/>
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Save Alignment Data" arrow describeChild>
          <span>
            <Button
              size={size as "medium" | "small" | undefined}
              disabled={containers.length === 0}
              variant="contained"
              onClick={e => {
                e.stopPropagation();
                // create starting instance
                const alignmentExport: AlignmentFile = {
                  type: 'translation',
                  meta: {
                    creator: 'ClearAligner',
                  },
                  records: [],
                };

                if (!appState.currentProject?.linksTable) {
                  return;
                }

                (appState.currentProject?.linksTable?.getAll?.() ?? [])
                  .map((link) =>
                    ({
                      id: link.id,
                      source: link.sources,
                      target: link.targets,
                    } as AlignmentRecord)
                  )
                  .forEach((record) => alignmentExport.records.push(record));

                // Create alignment file content
                const fileContent = JSON.stringify(
                  alignmentExport,
                  undefined,
                  2
                );

                // Create a Blob from the data
                const blob = new Blob([fileContent], {
                  type: 'application/json',
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
              }}
            >
              <FileDownload/>
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>
    </>
  )
}

export default UploadAlignmentGroup;
