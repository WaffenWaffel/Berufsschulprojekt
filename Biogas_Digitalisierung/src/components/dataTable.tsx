import {
    Table,
    TableBody,
    TableCell,
    // TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import * as React from "react"

  interface FilterField {
    key: string;   // Die ID der Spalte (z.B. "email" oder "kunde")
    label: string; // Was im Platzhalter stehen soll (z.B. "E-Mail" oder "Kundenname")
  }

  interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filterFields?: FilterField[]
  }

  export function DataTable<TData, TValue>({
    columns,
    data,
    filterFields = []
  }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
      []
    )
    const table = useReactTable({
      data,
      columns, 
      getCoreRowModel: getCoreRowModel(),
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        sorting,
        columnFilters,
      },
    })
    return (
      <div>
        {filterFields.length > 0 && (
        <div className="flex flex-wrap gap-2 py-4">
          {filterFields.map((field) => (
            <Input
              key={field.key}
              placeholder={`${field.label} filtern...`}
              value={(table.getColumn(field.key)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(field.key)?.setFilterValue(event.target.value)
              }
              className="max-w-sm w-[200px]" // Feste Breite, damit es ordentlich aussieht
            />
          ))}
        </div>
        )}
        {/* <div>
          <Input
            placeholder={`Filter ${filterColumn}`}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div> */}
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header,
                        header.getContext()
                        )}
                    </TableHead>
                  )
                })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow 
                  key={row.id}
                  data-state = {row.getIsSelected() && "selecteed"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }
  