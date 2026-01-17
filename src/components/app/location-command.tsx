"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { defaultLocation, jurisdictions } from "@/lib/mock-data";

const locationOptions = jurisdictions.map((jurisdiction) => ({
  id: jurisdiction.id,
  label: jurisdiction.state
    ? `${jurisdiction.name}, ${jurisdiction.state}`
    : jurisdiction.name,
}));

export default function LocationCommand() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>(defaultLocation.label);

  return (
    <>
      <Button
        variant="outline"
        className="h-9 gap-2 border-border bg-card text-foreground"
        onClick={() => setOpen(true)}
      >
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{value}</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search city or county..." />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>
          <CommandGroup heading="Nearby">
            {locationOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.label}
                onSelect={(label) => {
                  setValue(label);
                  setOpen(false);
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
