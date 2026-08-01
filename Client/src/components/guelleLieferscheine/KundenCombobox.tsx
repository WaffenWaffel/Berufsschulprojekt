import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { GuelleKunde } from "./types"

interface KundenComboboxProps {
  kunden: GuelleKunde[]
  selected: GuelleKunde | null
  onSelect: (kunde: GuelleKunde) => void
  placeholder?: string
  id?: string
}

/**
 * Auswahl eines Kunden per Suchfeld. Wird sowohl beim Erfassen einer Abgabe
 * als auch beim Erstellen eines Lieferscheins verwendet.
 */
export function KundenCombobox({
  kunden,
  selected,
  onSelect,
  placeholder = "Kunde wählen...",
  id,
}: KundenComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? `${selected.Name}, ${selected.Vorname}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Suche Kunde..." />
          <CommandList>
            <CommandEmpty>Kein Kunde gefunden.</CommandEmpty>
            <CommandGroup>
              {kunden.map((kunde) => (
                <CommandItem
                  key={kunde.id}
                  // Nach Name und Vorname suchbar
                  value={`${kunde.Name} ${kunde.Vorname}`}
                  onSelect={() => {
                    onSelect(kunde)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected?.id === kunde.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {kunde.Name}, {kunde.Vorname}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
