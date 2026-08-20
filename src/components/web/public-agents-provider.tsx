"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicAgent } from "@/server/public-agents";

const AgentsContext = createContext<PublicAgent[]>([]);

export function PublicAgentsProvider({
  agents,
  children,
}: {
  agents: PublicAgent[];
  children: ReactNode;
}) {
  return <AgentsContext.Provider value={agents}>{children}</AgentsContext.Provider>;
}

export function usePublicAgents() {
  return useContext(AgentsContext);
}
