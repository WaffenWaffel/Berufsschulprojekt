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

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// import type { GuelleKunden } from "./columns"
// import { Rss } from "lucide-react"
import { useState } from "react"

export function CreateCustomer() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        KundenNr: "",
        Name:"",
        Vorname: "",
        PLZ: "",
        Wohnort: "",
        Straße: "",
        HNr: ""
    });

    const handleSave =async () => {
        setLoading(true);
        try{
            const response = await fetch('/api/neuerKunde', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    KundenNr: Number(formData.KundenNr),
                    PLZ: Number(formData.PLZ)
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
                <Button variant="outline">Neuen Kunden anlegen</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Kunden anlegen</DialogTitle>
                  <FieldSet>
                   <FieldGroup>
                       <FieldDescription>
                           Alle Felder müssen ausgefüllt werden
                           </FieldDescription>
                        <Field>
                           <FieldLabel htmlFor="kundenNr">KundenNr</FieldLabel>
                           <Input 
                            id="kundenNr" 
                            type="number" 
                            placeholder="0" 
                            value={formData.KundenNr} 
                            onChange={(e) => setFormData({...formData, KundenNr: e.target.value})} 
                            />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="kundenName">Name</FieldLabel>
                           <Input 
                            id="kundenName" 
                            type="text" 
                            placeholder="Mustermann"  
                            value={formData.Name} 
                            onChange={(e) => setFormData({...formData, Name: e.target.value})}  
                            />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="kundenNachname">Vorname</FieldLabel>
                           <Input 
                            id="kundenNachname" 
                            type="text" 
                            placeholder="Max" 
                            value={formData.Vorname} 
                            onChange={(e) => setFormData({...formData, Vorname: e.target.value})} 
                            />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="plz">Postleitzahl</FieldLabel>
                           <Input 
                            id="plz" 
                            type="number" 
                            placeholder="86733" 
                            value={formData.PLZ} 
                            onChange={(e) => setFormData({...formData, PLZ: e.target.value})} 
                            />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="wohnort">Wohnort</FieldLabel>
                           <Input 
                            id="wohnort" 
                            type="text" 
                            placeholder="Alerheim" 
                            value={formData.Wohnort} 
                            onChange={(e) => setFormData({...formData, Wohnort: e.target.value})} 
                            />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="straße">Straße</FieldLabel>
                           <Input 
                            id="straße" 
                            type="text" 
                            placeholder="Dorfstraße" 
                            value={formData.Straße} 
                            onChange={(e) => setFormData({...formData, Straße: e.target.value})} 
                            />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="hnr">Hausnummer</FieldLabel>
                           <Input 
                            id="hnr" 
                            type="text" 
                            placeholder="8" 
                            value={formData.HNr} 
                            onChange={(e) => setFormData({...formData, HNr: e.target.value})} 
                            />
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