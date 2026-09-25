import { bundleBin } from '../../../tools/bundle-tooling-bin.mjs';

await bundleBin(import.meta.url, 'LOOM_CLI_VERSION');
