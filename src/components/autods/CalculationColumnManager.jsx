import TableColumnManager from "./TableColumnManager";
import {
  allManageableCalculationColumnIds,
  CALCULATION_GRID_COLUMN_COUNT,
  defaultVisibleCalculationColumnIds,
  manageableCalculationColumns,
} from "./calculationColumns";

function CalculationColumnManager({ visibleColumnIds, onChange }) {
  return (
    <TableColumnManager
      visibleColumnIds={visibleColumnIds}
      onChange={onChange}
      columns={manageableCalculationColumns}
      defaultColumnIds={defaultVisibleCalculationColumnIds}
      allColumnIds={allManageableCalculationColumnIds}
      totalColumnCount={CALCULATION_GRID_COLUMN_COUNT}
      dialogLabel="Customise calculations grid"
    />
  );
}

export default CalculationColumnManager;
