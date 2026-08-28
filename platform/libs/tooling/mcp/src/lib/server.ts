import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { portableOptions, ScaffoldDescriptor, SCAFFOLDS } from '@loomweaver/devkit';
import { z, ZodTypeAny } from 'zod';
import {
  listGenerators,
  scaffold,
  toolName,
  validateCatalogTool,
  validateI18nTool,
  validateManifestTool,
} from './tools';

const FILE_MAP_NOTE =
  'Returns a file map (relative path -> content); write the files into your project. May also ' +
  'return "remaining": steps the workspace needs that this route cannot perform, each saying what ' +
  'it costs to skip. Carry them out, or the generated output builds and does not work.';

function inputSchema(
  descriptor: ScaffoldDescriptor,
): Record<string, ZodTypeAny> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const option of portableOptions(descriptor)) {
    const base =
      option.type === 'boolean'
        ? z.boolean()
        : option.choices
          ? z.enum(option.choices as [string, ...string[]])
          : z.string();
    const described = base.describe(option.description);
    shape[option.name] = option.required ? described : described.optional();
  }
  return shape;
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'loomweaver-devkit',
    version: process.env['LOOM_MCP_VERSION'] ?? '0.0.0-dev',
  });

  server.registerTool(
    'list_generators',
    {
      description: 'List the available LoomWeaver scaffolding generators.',
      inputSchema: {},
    },
    async () => listGenerators(),
  );

  for (const descriptor of SCAFFOLDS) {
    server.registerTool(
      toolName(descriptor),
      {
        description: `Scaffold ${descriptor.summary}. ${FILE_MAP_NOTE}`,
        inputSchema: inputSchema(descriptor),
      },
      async (args) => scaffold(descriptor, args),
    );
  }

  server.registerTool(
    'validate_manifest',
    {
      description:
        'Validate a plugin manifest (id, capabilities). Returns findings.',
      inputSchema: {
        id: z.string().optional(),
        name: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
      },
    },
    async (args) => validateManifestTool(args),
  );

  server.registerTool(
    'validate_i18n',
    {
      description:
        'Validate i18n key parity across languages. Input: bundles = { <lang>: <nested object> }.',
      inputSchema: {
        bundles: z.record(z.string(), z.record(z.string(), z.unknown())),
      },
    },
    async (args) => validateI18nTool(args),
  );

  server.registerTool(
    'validate_catalog',
    {
      description:
        'Validate a plugin store catalog (the parsed JSON array). The host parses catalogs defensively, so bad fields and whole entries disappear without a word; each finding names that consequence. Returns findings.',
      inputSchema: {
        catalog: z
          .array(z.unknown())
          .describe('The parsed catalog JSON — an array of entries.'),
      },
    },
    async (args) => validateCatalogTool(args),
  );

  return server;
}
