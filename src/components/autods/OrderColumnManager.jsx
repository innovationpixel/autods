import TableColumnManager from "./TableColumnManager";
import {
  allManageableColumnIds,
  defaultVisibleColumnIds,
  manageableOrderColumns,
  ORDER_GRID_COLUMN_COUNT,
} from "./orderColumns";

function OrderColumnManager({ visibleColumnIds, onChange }) {
  return (
    <TableColumnManager
      visibleColumnIds={visibleColumnIds}
      onChange={onChange}
      columns={manageableOrderColumns}
      defaultColumnIds={defaultVisibleColumnIds}
      allColumnIds={allManageableColumnIds}
      totalColumnCount={ORDER_GRID_COLUMN_COUNT}
      dialogLabel="Customise order grid"
    />
  );
}

export default OrderColumnManager;
