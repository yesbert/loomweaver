import { bundleBin } from '../../../tools/bundle-tooling-bin.mjs';

await bundleBin(import.meta.url, 'LOOM_MCP_VERSION');
