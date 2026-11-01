import type { ReactNode } from "react";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { btnXs, table } from "@/components/m2/lab-ui/page";

export type CatalogRow = { id: string; label: string; initial: Record<string, unknown>; cells: ReactNode[]; extra?: ReactNode };

/** Bảng danh mục: mỗi dòng có Sửa (hộp thoại) và Xóa; chỉ hiện nút khi có quyền ghi. */
export function CatalogTable({ entity, headers, rows, fields, canWrite, emptyText = "Chưa có dữ liệu" }: { entity: string; headers: string[]; rows: CatalogRow[]; fields: CrudField[]; canWrite: boolean; emptyText?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={table}>
        <thead>
          <tr>
            {headers.map((h) => <th key={h}>{h}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={headers.length + 1} className="py-8 text-center text-muted-foreground">{emptyText}</td></tr>}
          {rows.map((r) => (
            <tr key={r.id}>
              {r.cells.map((c, i) => <td key={i}>{c}</td>)}
              <td className="whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  {r.extra}
                  {canWrite && (
                    <>
                      <EntityFormDialog mode="edit" endpoint={`/api/${entity}`} id={r.id} title={`Sửa ${r.label}`} fields={fields} initial={r.initial} trigger={<button type="button" className={btnXs}>Sửa</button>} />
                      <DeleteEntityButton entity={entity} id={r.id} label={r.label} />
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
