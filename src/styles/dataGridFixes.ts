/**
 * This file contains custom styling for the DataGrid.
 */

import { gridClasses } from '@mui/x-data-grid';

/**
 * add to sx on DataGrid in order to fix choppy resize animations with many rows in DataGrid
 */
export const DataGridResizeAnimationFixes = {
  '& .MuiDataGrid-main': {
    width: 0,
    minWidth: '100%',
  },
};

/**
 * add to sx on DataGrid in order to ensure the scrollbar is properly displayed
 */
export const DataGridScrollbarDisplayFix = {
  '.MuiTablePagination-root::-webkit-scrollbar': {
    width: 0,
  },
};

export const DataGridSetMinRowHeightToDefault = {
  '.MuiDataGrid-cell': {
    minHeight: '52px !important',
  },
};

/**
 * CA-102 add sx on DataGrid to fix the triple icon button that gets slightly
 * overlapped on the right side by the column divider.
 */
export const DataGridTripleIconMarginFix = {
  '.MuiDataGrid-menuIcon' : { mr: 0}
}

/**
 * CA-102 add sx on DataGrid to move the Select All Checkbox into the
 * AlignmentTableControlPanel
 */
export const DataGridSelectAllCheckboxFix = {
  '& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer' : {
    position: 'absolute',
    top: '-66px',
    left: '2px',
  },
  '[class*="MuiData"]': {
    overflow: 'visible',
  },
  [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]: {
    outline: 'none'
  }
}

/**
 * CA-102 add sx on TableContainer to allow the checkbox to overflow outside
 * the TableContainer
 */
export const TableContainerFix= {
  overflow: 'visible',
}



