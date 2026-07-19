import TableColumnManager from "./TableColumnManager";
import {
  allManageableProductColumnIds,
  defaultVisibleProductColumnIds,
  manageableProductColumns,
  PRODUCT_GRID_COLUMN_COUNT,
} from "./productColumns";

function ProductColumnManager({ visibleColumnIds, onChange }) {
  return (
    <TableColumnManager
      visibleColumnIds={visibleColumnIds}
      onChange={onChange}
      columns={manageableProductColumns}
      defaultColumnIds={defaultVisibleProductColumnIds}
      allColumnIds={allManageableProductColumnIds}
      totalColumnCount={PRODUCT_GRID_COLUMN_COUNT}
      dialogLabel="Customise product grid"
    />
  );
}

export default ProductColumnManager;
