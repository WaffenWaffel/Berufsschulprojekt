import {
  Table,
  TableBody,
  TableCell,
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
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import * as React from "react"

// NEU: Imports für das Dropdown-Menü
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterField {
  key: string;
  label: string;
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns, 
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    // Wir starten standardmäßig mit 15 Einträgen pro Seite
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  })

  // Hilfsfunktion: Erzeugt ein Array mit den Seitenzahlen (z.B. [0, 1, 2] für 3 Seiten)
  const pageCount = table.getPageCount();
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i);

  return (
    <div>
      {/* Filter Bereich */}
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
              className="max-w-sm w-[200px]"
            />
          ))}
        </div>
      )}

      {/* Tabellen Bereich */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder 
                        ? null 
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  Keine Ergebnisse.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* NEU: Unterer Bereich (Paginierung & Dropdown) */}
      <div className="flex items-center justify-between py-4">
        
        {/* Linke Seite: Dropdown (Nur wenn mehr als 15 Daten vorhanden sind) */}
        <div className="flex items-center">
          {data.length > 15 && (
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">Zeilen pro Seite:</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 15, 20, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Rechte Seite: Paginierungs-Buttons < 1 2 3 > */}
        <div className="flex items-center space-x-1">
          {/* Zurück Button */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </Button>

          {/* Dynamische Seitenzahlen (1, 2, 3...) */}
          {pageNumbers.map((pageIndex) => (
            <Button
              key={pageIndex}
              // Die aktuelle Seite wird visuell hervorgehoben ("default" vs "outline")
              variant={table.getState().pagination.pageIndex === pageIndex ? "default" : "outline"}
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(pageIndex)}
            >
              {pageIndex + 1}
            </Button>
          ))}

          {/* Weiter Button */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </Button>
        </div>
        
      </div>
    </div>
  )
}