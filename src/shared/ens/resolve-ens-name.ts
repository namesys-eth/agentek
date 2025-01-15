import { z } from "zod";
import { createTool } from "../client";

export const resolveENSTool = createTool({
  name: "resolveENS",
  description: "Resolves an ENS name to an Ethereum address",
  parameters: z.object({
    name: z.string().describe("The ENS name to resolve"),
  }),
  execute: async (client, args) => {
    const publicClient = client.getPublicClient();
    return await publicClient.getEnsAddress({
      name: args.name,
    });
  },
});

export const lookupENSTool = createTool({
  name: "lookupENS",
  description: "Looks up the ENS name for an Ethereum address",
  parameters: z.object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .describe("The Ethereum address to lookup"),
  }),
  execute: async (client, args) => {
    const publicClient = client.getPublicClient();
    return await publicClient.getEnsName({
      address: args.address as `0x${string}`,
    });
  },
});
