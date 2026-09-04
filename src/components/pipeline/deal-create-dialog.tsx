"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDeal } from "@/server/deals";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

type CustomerOption = { id: string; name: string; phone: string | null };
type AgentOption = { id: string; full_name: string; role: string };

export function DealCreateDialog({
  customers,
  agents,
  currentUserId,
  canAssign,
}: {
  customers: CustomerOption[];
  agents: AgentOption[];
  currentUserId: string;
  canAssign: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [dealType, setDealType] = useState("sale");
  const [assignedTo, setAssignedTo] = useState(currentUserId);

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 40);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [customers, customerQuery]);

  function resetForm() {
    setCustomerId("");
    setCustomerQuery("");
    setTitle("");
    setValue("");
    setDealType("sale");
    setAssignedTo(currentUserId);
  }

  function handleCustomerChange(id: string | null) {
    const next = id ?? "";
    setCustomerId(next);
    const customer = customers.find((c) => c.id === next);
    if (customer && !title.trim()) {
      setTitle(`Sale — ${customer.name}`);
    }
  }

  function handleCreate() {
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    startTransition(async () => {
      const result = await createDeal({
        title: title.trim() || `Sale — ${customer?.name ?? "Deal"}`,
        customer_id: customerId,
        deal_type: dealType,
        value: value ? Number(value) : undefined,
        assigned_to: canAssign ? assignedTo || currentUserId : currentUserId,
      });
      if (result.ok && result.data) {
        toast.success("Deal created");
        setOpen(false);
        resetForm();
        router.push(`/pipeline/${result.data.id}`);
      } else {
        toast.error(result.error ?? "Could not create deal");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger
        render={(props) => (
          <Button {...props} size="sm">
            <Plus className="mr-1 h-4 w-4" /> New deal
          </Button>
        )}
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-deal-customer-q">Customer</Label>
            <Input
              id="new-deal-customer-q"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Search by name or phone…"
            />
            <Select value={customerId || undefined} onValueChange={handleCustomerChange}>
              <SelectTrigger>
                <span className="truncate">
                  {selectedCustomer
                    ? `${selectedCustomer.name}${selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ""}`
                    : "Select customer"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {filteredCustomers.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">No customers found</div>
                ) : (
                  filteredCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-deal-title">Title</Label>
            <Input
              id="new-deal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sale — Client name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={dealType} onValueChange={(v) => setDealType(v ?? "sale")}>
                <SelectTrigger>
                  <span className="capitalize">{dealType.replace(/_/g, " ")}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                  <SelectItem value="off_plan">Off plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-deal-value">Value (AED)</Label>
              <Input
                id="new-deal-value"
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>
          {canAssign ? (
            <div className="space-y-1.5">
              <Label>Assigned agent</Label>
              <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? currentUserId)}>
                <SelectTrigger>
                  <span className="truncate">
                    {agents.find((a) => a.id === assignedTo)?.full_name ?? "Select agent"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending || !customerId} onClick={handleCreate}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
