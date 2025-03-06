import { z } from "zod";
import { createTool } from "../client";
import { Address, formatEther, Hex, formatUnits, parseEther } from "viem";
import {
  arbitrum,
  base,
  mainnet,
  mode,
  optimism,
  polygon,
  sepolia,
} from "viem/chains";
import { addressSchema, clean } from "../utils";

const supportedChains = [
  mainnet,
  base,
  arbitrum,
  polygon,
  optimism,
  mode,
  sepolia,
];

const getBalance = createTool({
  name: "getBalance",
  description: "Get the ETH balance for an address",
  supportedChains,
  parameters: z.object({
    address: z.string(),
    chainId: z.number().optional(),
    formatEth: z.boolean().optional(),
  }),
  execute: async (client, args) => {
    if (args.chainId) {
      const publicClient = client.getPublicClient(args.chainId);
      const balance = await publicClient.getBalance({
        address: args.address as Address,
      });
      return args.formatEth ? formatEther(balance) : balance.toString();
    }

    const results = await Promise.all(
      client.filterSupportedChains(supportedChains).map(async (chain) => {
        const publicClient = client.getPublicClient(chain.id);
        const balance = await publicClient.getBalance({
          address: args.address as Address,
        });
        return {
          chainId: chain.id,
          balance: args.formatEth ? formatEther(balance) : balance.toString(),
        };
      }),
    );
    return results;
  },
});

const getCode = createTool({
  name: "getCode",
  description: "Get the bytecode of an address",
  supportedChains,
  parameters: z.object({
    address: z.string(),
    chainId: z.number().optional(),
  }),
  execute: async (client, args) => {
    if (args.chainId) {
      const publicClient = client.getPublicClient(args.chainId);
      return publicClient.getCode({ address: args.address as Address });
    }

    const results = await Promise.all(
      client.filterSupportedChains(supportedChains).map(async (chain) => {
        const publicClient = client.getPublicClient(chain.id);
        const code = await publicClient.getCode({
          address: args.address as Address,
        });
        return {
          chainId: chain.id,
          code,
        };
      }),
    );
    return results;
  },
});

const getTransactionCount = createTool({
  name: "getTransactionCount",
  description: "Get the number of transactions sent from an address",
  supportedChains,
  parameters: z.object({
    address: z.string(),
    chainId: z.number().optional(),
  }),
  execute: async (client, args) => {
    if (args.chainId) {
      const publicClient = client.getPublicClient(args.chainId);
      return publicClient.getTransactionCount({
        address: args.address as Address,
      });
    }

    const results = await Promise.all(
      client.filterSupportedChains(supportedChains).map(async (chain) => {
        const publicClient = client.getPublicClient(chain.id);
        const count = await publicClient.getTransactionCount({
          address: args.address as Address,
        });
        return {
          chainId: chain.id,
          count,
        };
      }),
    );
    return results;
  },
});

// Block Tools
const getBlock = createTool({
  name: "getBlock",
  description: "Get information about a block",
  supportedChains,
  parameters: z.object({
    blockNumber: z.number().optional(),
    blockHash: z.string().optional(),
    chainId: z.number(),
  }),
  execute: async (client, args) => {
    const publicClient = client.getPublicClient(args.chainId);
    if (args.blockHash) {
      return publicClient.getBlock({ blockHash: args.blockHash as Hex });
    }

    if (args.blockNumber) {
      return publicClient.getBlock({
        blockNumber: BigInt(args.blockNumber),
      });
    }

    return publicClient.getBlock();
  },
});

const getBlockNumber = createTool({
  name: "getBlockNumber",
  description: "Get the current block number",
  supportedChains,
  parameters: z.object({
    chainId: z.number().optional(),
  }),
  execute: async (client, args) => {
    if (args.chainId) {
      const publicClient = client.getPublicClient(args.chainId);
      const blockNumber = await publicClient.getBlockNumber();

      return {
        chainId: args.chainId,
        blockNumber: blockNumber.toString(),
      };
    }

    const results = await Promise.all(
      client.filterSupportedChains(supportedChains).map(async (chain) => {
        const publicClient = client.getPublicClient(chain.id);
        const blockNumber = await publicClient.getBlockNumber();
        return {
          chainId: chain.id,
          blockNumber: blockNumber.toString(),
        };
      }),
    );

    return results;
  },
});

// Gas Tools
const getGasPrice = createTool({
  name: "getGasPrice",
  description:
    "Get the current gas price. If chainId is not specified, will return gas price for all supported chains.",
  supportedChains,
  parameters: z.object({
    chainId: z.number().optional(),
    formatGwei: z.boolean().optional(),
  }),
  execute: async (client, args) => {
    const chains = client.filterSupportedChains(supportedChains, args.chainId);

    if (args.chainId) {
      const publicClient = client.getPublicClient(args.chainId);
      const gasPrice = await publicClient.getGasPrice();
      return {
        chainId: args.chainId,
        gasPrice: args.formatGwei
          ? formatUnits(gasPrice, 9)
          : gasPrice.toString(),
      };
    }

    const results = await Promise.all(
      chains.map(async (chain) => {
        const publicClient = client.getPublicClient(chain.id);
        const gasPrice = await publicClient.getGasPrice();
        return {
          chainId: chain.id,
          gasPrice: args.formatGwei
            ? formatUnits(gasPrice, 9)
            : gasPrice.toString(),
        };
      }),
    );

    return results;
  },
});

const estimateGas = createTool({
  name: "estimateGas",
  description: "Estimate gas for a transaction",
  supportedChains,
  parameters: z.object({
    to: addressSchema,
    value: z.string().optional(),
    data: z.string().optional(),
    chainId: z.number().optional(),
  }),
  execute: async (client, args) => {
    if (args.chainId) {
      const publicClient = client.getPublicClient(args.chainId);
      const from = await client.getAddress();
      const gas = publicClient.estimateGas({
        account: from,
        to: args.to,
        value: args.value ? parseEther(args.value) : undefined,
        data: args.data as `0x${string}` | undefined,
      });

      return {
        chainId: args.chainId,
        gas: gas.toString(),
      };
    }

    const from = await client.getAddress();
    const results = await Promise.all(
      client.filterSupportedChains(supportedChains).map(async (chain) => {
        const publicClient = client.getPublicClient(chain.id);
        const gas = await publicClient.estimateGas({
          account: from,
          to: args.to,
          value: args.value ? parseEther(args.value) : undefined,
          data: args.data as `0x${string}` | undefined,
        });
        return {
          chainId: chain.id,
          gas: gas.toString(),
        };
      }),
    );

    return results;
  },
});

const getFeeHistory = createTool({
  name: "getFeeHistory",
  description: "Get historical gas fee info",
  supportedChains,
  parameters: z.object({
    blockCount: z
      .number()
      .describe(
        "Number of blocks in the requested range. Between 1 and 1024 blocks can be requested in a single query. Less than requested may be returned if not all blocks are available.",
      ),
    rewardPercentiles: z
      .array(z.number())
      .optional()
      .describe(
        "A monotonically increasing list of percentile values to sample from each block's effective priority fees per gas in ascending order, weighted by gas used.",
      ),
    chainId: z.number(),
  }),
  execute: async (client, args) => {
    const publicClient = client.getPublicClient(args.chainId);
    return publicClient.getFeeHistory({
      blockCount: args.blockCount,
      rewardPercentiles: args.rewardPercentiles || [],
    });
  },
});

const getTransaction = createTool({
  name: "getTransaction",
  description: "Get details about a transaction",
  supportedChains,
  parameters: z.object({
    hash: z.string(),
    chainId: z.number(),
  }),
  execute: async (client, args) => {
    const publicClient = client.getPublicClient(args.chainId);
    const tx = publicClient.getTransaction({
      hash: args.hash as Hex,
    });

    return clean(tx);
  },
});

const getTransactionReceipt = createTool({
  name: "getTransactionReceipt",
  description: "Get the receipt of a transaction",
  supportedChains,
  parameters: z.object({
    hash: z.string(),
    chainId: z.number(),
  }),
  execute: async (client, args) => {
    const publicClient = client.getPublicClient(args.chainId);
    let receipt = await publicClient.getTransactionReceipt({
      hash: args.hash as Hex,
    });

    return clean(receipt);
  },
});

export {
  getBalance,
  getCode,
  getTransactionCount,
  getBlock,
  getBlockNumber,
  getGasPrice,
  estimateGas,
  getFeeHistory,
  getTransaction,
  getTransactionReceipt,
};
