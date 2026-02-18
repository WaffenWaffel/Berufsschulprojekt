import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Field,
  FieldLabel,
} from "@/components/ui/field"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const kunden = ["Albrecht", "Nass"]

export function GuelleInput() {
  const [date, setDate] = useState<Date | undefined>()

  return (
    <Card size="default" className="mx-auto w-full max-w-sm" >
        <CardHeader>
            <CardTitle>Gülle Menge eingeben</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="guelleMenge">Menge</FieldLabel>
            <Input id="guelleMenge" type="number" placeholder="0" />
            <Combobox items={kunden}>
              <ComboboxInput placeholder="Kunden wählen"></ComboboxInput>
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!date}
                  className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                >
                  <CalendarIcon />
                  {date ? format(date, "PPP") : <span>Datum wählen</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>        
          </Field>
        </CardContent>
        <CardFooter>
          <Button type="submit" color="#rgba(15, 145, 178)" variant="outline">Speichern</Button>
        </CardFooter>
    </Card>
    
  )
}