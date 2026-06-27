import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const guelleMengen = [
  {
    Kunde: "Nass",
    Menge: "300",
    Datum: "16.02.2025",
  },
  {
    Kunde: "Albrecht",
    Menge: "200",
    Datum: "16.05.2026"
  }
]

export function GuelleTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Kunde</TableHead>
          <TableHead>Menge in m³</TableHead>
          <TableHead>Datum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {guelleMengen.map((guelleMenge) => (
          <TableRow key={guelleMenge.Kunde}>
            <TableCell className="font-medium">{guelleMenge.Kunde}</TableCell>
            <TableCell>{guelleMenge.Menge}</TableCell>
            <TableCell>{guelleMenge.Datum}</TableCell>
            {/* <TableCell className="text-right">{invoice.totalAmount}</TableCell> */}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Gesamt</TableCell>
          <TableCell className="text-right">500</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
