import { Link } from '../../structs';
import { DataGrid, GridColDef, GridSortItem } from '@mui/x-data-grid';
import { TableContainer } from '@mui/material';

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'Id',
  },
  {
    field: 'sources',
    headerName: 'Sources',
  },
  {
    field: 'targets',
    headerName: 'Targets',
  },
];

export interface AlignmentTableProps {
  sort: GridSortItem | null;
  alignments: Link[];
  onChangeSort: (sortData: GridSortItem | null) => void;
}

export const AlignmentTable = ({
  sort,
  alignments,
  onChangeSort,
}: AlignmentTableProps) => {
  return (
    <TableContainer
      sx={{
        width: '100%',
        height: '100%',
        '.MuiTableContainer-root::-webkit-scrollbar': {
          width: 0,
        },
      }}
    >
      <DataGrid
        sx={{
          width: '100%',
          '.MuiTablePagination-root::-webkit-scrollbar': {
            width: 0,
          },
        }}
        rowSelection={false}
        rows={alignments}
        columns={columns}
        getRowId={(row) => row.id}
        sortModel={sort ? [sort] : []}
        onSortModelChange={(newSort, details) => {
          if (!newSort || newSort.length < 1) {
            onChangeSort(sort);
          }
          onChangeSort(newSort[0] /*only single sort is supported*/);
        }}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 20 },
          },
        }}
        pageSizeOptions={[20, 50]}
      />
    </TableContainer>
  );
};
