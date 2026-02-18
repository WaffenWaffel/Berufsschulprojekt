import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSet,
  } from "@/components/ui/field"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"

import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

export function CreateAnalysis() {
    const [date, setDate] = useState<Date | undefined>()
    return(
        <Dialog>
            <DialogTrigger>
                <Button variant="outline">Neuen Analyse anlegen</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Analyse anlegen</DialogTitle>
                  <FieldSet>
                   <FieldGroup>
                       <FieldDescription>
                           Alle Felder müssen ausgefüllt werden
                           </FieldDescription>
                       <Field>
                           <FieldLabel htmlFor="stickstoff">Gesamtstickstoff</FieldLabel>
                           <Input id="stickstoff" type="number" placeholder="" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="amoniumstickstoff">Amoniumstickstoff</FieldLabel>
                           <Input id="amoniumstickstoff" type="nubmer" placeholder="" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="phosphat">Phosphat</FieldLabel>
                           <Input id="phosphat" type="number" placeholder="" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="kalium">Kalium</FieldLabel>
                           <Input id="kalium" type="number" placeholder="" />
                       </Field>
                       <Field>
                            <FieldLabel >Datum</FieldLabel>
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
                   </FieldGroup>
                </FieldSet>
                </DialogHeader>
                <DialogFooter className="sm:justify-start">
                  <DialogClose asChild>
                    <Button type="submit" color="#rgba(15, 145, 178)" variant="outline">Erstellen</Button>
                  </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}