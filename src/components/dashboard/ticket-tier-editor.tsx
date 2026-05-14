"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Tier {
  id: string;
  name: string;
  price: string;
  capacity: string;
  description: string;
}

export function TicketTierEditor() {
  const [tiers, setTiers] = React.useState<Tier[]>([
    { id: "1", name: "General Admission", price: "0", capacity: "500", description: "Standard entry" },
  ]);

  const addTier = () => {
    setTiers([...tiers, { id: String(Date.now()), name: "", price: "0", capacity: "100", description: "" }]);
  };

  const updateTier = (id: string, field: keyof Tier, value: string) => {
    setTiers(tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTier = (id: string) => {
    setTiers(tiers.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      {tiers.map((tier) => (
        <div key={tier.id} className="p-4 rounded-lg border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ticket Tier</span>
            {tiers.length > 1 && (
              <button onClick={() => removeTier(tier.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tier Name</Label>
              <Input value={tier.name} onChange={(e) => updateTier(tier.id, "name", e.target.value)} placeholder="e.g., VIP" />
            </div>
            <div>
              <Label>Price (ETB)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ETB</span>
                <Input className="pl-12" value={tier.price} onChange={(e) => updateTier(tier.id, "price", e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input value={tier.capacity} onChange={(e) => updateTier(tier.id, "capacity", e.target.value)} placeholder="500" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={tier.description} onChange={(e) => updateTier(tier.id, "description", e.target.value)} placeholder="Brief description of this tier" className="min-h-[60px]" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addTier} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Tier
      </Button>
    </div>
  );
}
