/**
 * This file contains the logic to use the AlignmentTable component
 * in Storybook
 */
import { Meta } from '@storybook/react';
import { AlignmentTable, AlignmentTableProps } from './alignmentTable';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AlignmentSide, Link, TextDirection } from '../../structs';
import { LocalizedWordEntry } from './structs';
import { AppContext, AppContextProps } from '../../App';

const meta: Meta<typeof AlignmentTable> = {
  title: 'Concordance View/AlignmentTable',
  component: AlignmentTable
};

export default meta;

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

export const CA102 = (props: MockedAlignmentTableProps) => {
  // @ts-ignore
  window.databaseApi = {
    corporaGetLinksByAlignedWord: async (...args: any[]) => {
      // @ts-ignore
      console.log('args: ', args);
      return (props.links);
    }
  };
  return (
    <AppContext.Provider value={{
      containers: {
        sourceContainer: undefined,
        targetContainer: undefined,
      }
    } as AppContextProps} >
      <AlignmentTable
        {...props}
      />
    </AppContext.Provider>
  );
};
CA102.args = {
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
  links: [{
    id: 'asdfasdf',
    sources: [new BCVWP(1, 1, 1, 1, 1).toReferenceString()],
    targets: [new BCVWP(1, 1, 1, 3, 1).toReferenceString()]
  }, {
    'id': 'ceeb33a7-31fe-41a0-993c-d92a1415232e',
    'sources': [
      '010010010021'
    ],
    'targets': [
      '01001001003'
    ]
  }
  ] as Link[]
} as MockedAlignmentTableProps;


