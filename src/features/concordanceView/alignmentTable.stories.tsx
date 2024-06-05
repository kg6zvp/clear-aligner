/**
 * This file contains the logic to use the AlignmentTable component
 * in Storybook
 */
import { Meta } from '@storybook/react';
import { AlignmentTable, AlignmentTableProps } from './alignmentTable';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AlignmentSide, Link, LinkStatus, TextDirection } from '../../structs';
import { AppContext, AppContextProps } from '../../App';
import { useEffect } from 'react';
import { ProjectState } from '../../state/databaseManagement';

const meta: Meta<typeof AlignmentTable> = {
  title: 'Concordance View/AlignmentTable',
  component: AlignmentTable
};

export default meta;

/**
 * Default Storybook Test for the AlignmentTable
 */
export const Default = (props: AlignmentTableProps) => {
  return (
    <AlignmentTable
      {...props}
    />
  );
};

Default.args = {} as AlignmentTableProps;

interface MockedAlignmentTableProps extends AlignmentTableProps {
  links: Link[],
}

let linksForDbApi: Link[] = [];
// @ts-ignore
window.databaseApi = {};
// @ts-ignore
window.databaseApi.corporaGetLinksByAlignedWord = async (...args: any[]): Link[] | undefined => {
  // @ts-ignore
  console.log('args: ', args);
  return (linksForDbApi);
};

/**
 * Storybook Test for the AlignmentTable Component
 * This test has 4 links, one of which is rejected and should not appear
 * in the UI.
 */
export const FourLinksOneRejected = (props: MockedAlignmentTableProps) => {
  useEffect(() => {
    while (linksForDbApi.length > 0) {
      linksForDbApi.pop();
    }
    for (const l of props.links) {
      linksForDbApi.push(l);
    }
  },[props.links, props.links.length]);

  return (
    <AppContext.Provider value={{
      containers: {
        sourceContainer: undefined,
        targetContainer: undefined,
      },
      projectState: {
        userPreferenceTable: undefined
      } as unknown as ProjectState
    } as AppContextProps} >
      <AlignmentTable
        {...props}
      />
    </AppContext.Provider>
  );
};

const firstLink = new Link();
firstLink.id = 'firstlinkid';
firstLink.sources = [new BCVWP(1, 1, 1, 1, 1).toReferenceString()];
firstLink.targets = [new BCVWP(1, 1, 1, 3, 1).toReferenceString()];
firstLink.metadata.origin = "manual";
firstLink.metadata.status = LinkStatus.NEEDS_REVIEW;

const secondLink = new Link();
secondLink.id = 'secondlinkid';
secondLink.sources = [new BCVWP(1, 2, 1, 1, 2).toReferenceString()];
secondLink.targets = [new BCVWP(1, 2, 1, 1, 5).toReferenceString()];
secondLink.metadata.origin = "manual";
secondLink.metadata.status = LinkStatus.APPROVED;

const thirdLink = new Link();
thirdLink.id = 'thirdLinkid';
thirdLink.sources = [new BCVWP(1, 3, 1, 1, 2).toReferenceString()];
thirdLink.targets = [new BCVWP(1, 3, 1, 1, 5).toReferenceString()];
thirdLink.metadata.origin = "manual";
thirdLink.metadata.status = LinkStatus.CREATED;

const rejectedLink = new Link();
rejectedLink.id = 'rejectedLink';
rejectedLink.sources = [new BCVWP(1, 4, 1, 1, 2).toReferenceString()];
rejectedLink.targets = [new BCVWP(1, 4, 1, 1, 5).toReferenceString()];
rejectedLink.metadata.origin = "manual";
rejectedLink.metadata.status = LinkStatus.REJECTED;


FourLinksOneRejected.args = {
  wordSource: AlignmentSide.TARGET,
  pivotWord: {
    normalizedText: 'god',
    side: AlignmentSide.TARGET,
    frequency: 3,
    languageInfo: {
      code: 'eng',
      textDirection: TextDirection.LTR
    }
  },
  alignedWord: {
    id: '123412345',
    frequency: 5,
    sourceWordTexts: {
      text: 'Βίβλος',
      languageInfo: {
        code: 'grc',
        textDirection: TextDirection.LTR
      }
    },
    targetWordTexts: {
      text: 'roll',
      languageInfo: {
        code: 'eng',
        textDirection: TextDirection.LTR
      }
    }
  },
  links: [ firstLink, secondLink, thirdLink, rejectedLink] as Link[]
} as MockedAlignmentTableProps;


