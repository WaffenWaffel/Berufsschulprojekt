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

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        Stickstoff: "",
        Amoniumstickstoff:"",
        Phosphat: "",
        Kalium: "",
        Datum: "",
    });

    const handleSave =async () => {
        setLoading(true);
        try{
            const response = await fetch('/api/neueAnalyse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    Stickstoff: Number(formData.Stickstoff),
                    Amoniumstickstoff: Number(formData.Amoniumstickstoff),
                    Phosphat: Number(formData.Phosphat),
                    Kalium: Number(formData.Kalium),
                }),
            });
            if(!response.ok){
                throw new Error("Fehler beim Speichern")
            }
            setOpen(false)
            // const result = await response.json();
            // console.log("Server sagt:", result.message);
        } catch (error){
            console.error("Fehler beim POST:" , error)
        } finally{
            setLoading(false);
        }
    }

    return(
        <Dialog open={open} onOpenChange={setOpen}>
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
                           <Input 
                            id="stickstoff" 
                            type="number" 
                            placeholder=""
                            value={formData.Stickstoff} 
                            onChange={(e) => setFormData({...formData, Stickstoff: e.target.value})}  />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="amoniumstickstoff">Amoniumstickstoff</FieldLabel>
                           <Input 
                            id="amoniumstickstoff" 
                            type="nubmer" 
                            placeholder=""
                            value={formData.Amoniumstickstoff} 
                            onChange={(e) => setFormData({...formData, Amoniumstickstoff: e.target.value})}  />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="phosphat">Phosphat</FieldLabel>
                           <Input id="phosphat" type="number" placeholder="" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="kalium">Kalium</FieldLabel>
                           <Input 
                            id="kalium" 
                            type="number" 
                            placeholder="" 
                            value={formData.Kalium} 
                            onChange={(e) => setFormData({...formData, Kalium: e.target.value})} />
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
                                    <Calendar 
                                        mode="single" 
                                        selected={date} 
                                        onSelect={setDate} 
                                        value={formData.KundenNr} 
                                        onChange={(e) => setFormData({...formData, KundenNr: e.target.value})} />
                                </PopoverContent>
                            </Popover>
                       </Field>
                   </FieldGroup>
                </FieldSet>
                </DialogHeader>
                <DialogFooter className="sm:justify-start">
                  <DialogClose asChild>
                    <Button type="submit" color="#rgba(15, 145, 178)" variant="outline" onClick={handleSave} disabled={loading}>Erstellen</Button>
                  </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}