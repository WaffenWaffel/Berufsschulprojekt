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

export function CreateCustomer() {
    return(
        <Dialog>
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
                           <FieldLabel htmlFor="kundenName">Name</FieldLabel>
                           <Input id="kundenName" type="text" placeholder="Mustermann" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="kundenNachname">Vorname</FieldLabel>
                           <Input id="kundenNachname" type="text" placeholder="Max" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="plz">Postleitzahl</FieldLabel>
                           <Input id="plz" type="number" placeholder="86733" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="wohnort">Wohnort</FieldLabel>
                           <Input id="wohnort" type="text" placeholder="Alerheim" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="straße">Straße</FieldLabel>
                           <Input id="straße" type="text" placeholder="Dorfstraße" />
                       </Field>
                       <Field>
                           <FieldLabel htmlFor="hnr">Hausnummer</FieldLabel>
                           <Input id="hnr" type="text" placeholder="8" />
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