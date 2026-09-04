## 1. The recorder

- [ ] 1.1 `platform/tools/record-quick-start.mjs`: create a temporary directory, resolve the
      published `@loomweaver/cli` version and refuse to run unless it equals the newest `v*` git
      tag; check `ffmpeg` on PATH as the tour does. Reuse what `check-quick-start.mjs` already has
      for running the Quick start in a temporary directory.
- [ ] 1.2 Terminal half: run the Quick start commands with `child_process` (`CI=1`, no progress
      bars), keep a transcript with each step's real duration, and replay it into a `<pre>` on a
      local Playwright page: commands typed, output at once, a caption stating the real duration
      over `ng new` and the install.
- [ ] 1.3 Browser half: start `ng serve` in the temporary directory, open it in the same Playwright
      context with the tour's cursor and caption overlay, show the weaver's rail icon, open the
      palette, run the weaver's command, close on the caption *This is the application shell your
      product can grow into.*
- [ ] 1.4 Encode `assets/media/quick-start.{webm,mp4,gif}` and `quick-start-poster.jpg` with the
      tour's ffmpeg settings; print the final duration and fail if it exceeds ninety seconds.

## 2. Record

- [ ] 2.1 Run the recorder against the current release; watch the result once end to end and check
      the status bar shows the released version.
- [ ] 2.2 Commit the four media files.

## 3. Place it

- [ ] 3.1 `README.md`: the poster still under the Quick start's code block, before "That is the
      whole list", linking to the landing page's figure.
- [ ] 3.2 `docs/getting-started.md`: the figure after the introductory paragraph; decide whether
      `quick-start-light.png` stays as the still of the result and remove it if not.
- [ ] 3.3 `website/src/pages/index.astro`: a `figure.shot` after the Quick start section, dark set
      only, no theme switcher.
- [ ] 3.4 `website/tools/sync-docs.mjs`: add the four files to the required media list; verify by
      removing one and watching the build fail.

## 4. Operations note and hand over

- [ ] 4.1 `docs/reference/operations.md`: a paragraph beside the tour's saying what the recorder
      needs, that it records the published release gated on the newest tag, and when to re-record.
- [ ] 4.2 `npm run build` in `website/` passes; the formatter and the dash checker pass on the
      touched documents.
- [ ] 4.3 `openspec validate developer-path-screencast --strict` passes.
