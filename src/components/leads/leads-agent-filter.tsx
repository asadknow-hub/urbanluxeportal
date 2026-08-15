"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeadsAgentFilter({
  agents,
  assigned,
}: {
  agents: { id: string; full_name: string; role: string }[];
  assigned?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string | null) {
    const next = value ?? "all";
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("assigned");
    else params.set("assigned", next);
    router.push(`/leads?${params.toString()}`);
  }

  return (
    <Select value={assigned ?? "all"} onValueChange={onChange}>
      <SelectTrigger size="sm" className="h-8 w-[148px] text-xs" aria-label="Filter by agent">
        <SelectValue placeholder="All agents" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All agents</SelectItem>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
