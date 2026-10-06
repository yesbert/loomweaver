## 1. Generated blocks

- [x] 1.1 A guard that compares the contract blocks with the packed `.d.ts` by what each declaration accepts, with `--write`
- [x] 1.2 Bring the contract blocks to what the packages publish, keeping every comment in place
- [x] 1.3 The guard fails while a block differs, and runs in the pull-request build

## 2. Command lines

- [x] 2.1 A check that every `npx @loomweaver/cli …` line in `llms-full.txt`, `llms.txt` and `docs/` names a command and flags the CLI accepts, wired into the build
- [x] 2.2 The operations reference lists both guards
