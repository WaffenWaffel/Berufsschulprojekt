import {
    Field,
  } from "@/components/ui/field"

import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
  } from "@/components/ui/combobox"

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import React from "react"

const kunden = ["Albrecht", "Nass"]
const analysen = ["Dok1", "Dok2"]

export function CreateDelivery() {
    const [value, setValue] = React.useState<string[]>([])
    return(
        <Card size="default" className="mx-auto w-full max-w-sm" >
        <CardHeader>
            <CardTitle>Lieferschein Erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
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
            <Combobox 
                    items={analysen} 
                    multiple 
                    value={value}
                    onValueChange={setValue}>
                    <ComboboxChips>
                    <ComboboxValue>
                    {value.map((item) => (
                        <ComboboxChip key={item}>{item}</ComboboxChip>
                    ))}
                    </ComboboxValue>
                    <ComboboxChipsInput placeholder="Analysen hinzufügen" />
                </ComboboxChips>
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
          </Field>
        </CardContent>
        <CardFooter>
          <Button type="submit" color="#rgba(15, 145, 178)" variant="outline">Erstellen</Button>
        </CardFooter>
    </Card>
    )
}