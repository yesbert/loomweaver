## Context

See proposal.md, *Why*. What shapes the approach:

- `platform/tools/record-tour.mjs` drives Playwright's library, not its test runner, against a
  served testbed; it draws its own cursor, click ring and captions into the page, and encodes webm,
  mp4, gif and a poster with `ffmpeg`. It exists because the first tour was made by hand and could
  not be re-recorded when the chrome changed. The same lesson applies here with more force: the
  Quick start's commands change with every CLI release.
- `platform/tools/check-quick-start.mjs` already runs the Quick start end to end in a temporary
  directory (`ng new`, the install, both scaffolds, a build) and opens the result in Chromium
  through Playwright. It installs from packed local `dist/` rather than from the registry, and it
  asserts rather than records. The recorder is that script's shape with the registry as the source
  and a recording instead of assertions.
- The Quick start installs the published packages, so a recording is always of a release, never of
  a working tree. That is the property the last tour re-recording (#189) was about: the status bar
  must show a released version.
- The terminal part takes real time (`ng new` and the install are minutes, not seconds). A ninety
  second recording of a five minute run is a recording that cuts, and an honest cut is a visible
  caption, not a hidden splice.
- `website/tools/sync-docs.mjs` keeps a list of media files the build requires. GitHub READMEs
  embed images and GIFs only; the tour GIF weighs 3.9 MB for twenty-seven seconds.
- `docs/getting-started.md` already carries `assets/media/quick-start-light.png`, a still of the
  result.

## Goals / Non-Goals

**Goals:**

- A visitor sees the developer's path in under ninety seconds and believes the Quick start.
- The recording can be produced again by one command after a release, by anyone with `ffmpeg` and
  Playwright's browser, and the result is the same every time.
- A missing or stale recording fails the site build, as the tour does today.

**Non-Goals:**

- No narration, no music. Captions carry the words, as in the tour, so the muted autoplay says the
  same thing as the video.
- No second plugin in another framework. The Quick start scaffolds one Angular weaver; showing a
  sandboxed plugin is the tour's job and stays there. Ninety seconds is one path.
- No terminal emulator, no pseudo-terminal, no cinematic editing.
- No change to the tour, and no replacement of it on the first screen.

## Decisions

**A recorder script, not a hand recording.** `platform/tools/record-quick-start.mjs`. The
alternative, recording the screen by hand and following a written route, is what the first tour did
and what the operations notes warn against. The recording must be repeatable after every CLI
release, because the commands it shows are the ones the reader will type.

**The terminal half is a transcript replayed on a page, not a live terminal.** The recorder runs
the Quick start commands with `child_process` in a temporary directory, with `CI=1` and no progress
bars, and keeps their output as a transcript with the real duration of each step. It then renders
that transcript into a `<pre>` on a local Playwright page at a chosen pace: the command typed
character by character, its output appearing at once, and a caption over the long steps ("the
install took 2m10s, cut here"). The alternative first written for this change, a pseudo-terminal
rendered through `xterm.js` with a variable-rate time-lapse, was three tools for thirty seconds of
footage and a native build on every maintainer's machine. A replayed transcript is deterministic,
needs no new dependency, and uses the tour's overlay for cursor and captions, so the two halves
have one look.

**The browser half reuses the tour's overlay.** `ng serve` in the temporary directory, the product
opened in the same Playwright context, the weaver's icon in the rail, the palette, the command
running, and the closing caption. Three beats, under forty seconds, measured after encoding.

**Recorded against the published release, and gated on the latest tag.** `npx @loomweaver/cli`
resolves from the registry. The recorder refuses to run unless the version it resolves equals the
newest `v*` git tag. Gating on `Directory.Build.props` instead, as first written, would break the
moment a version bump lands on `main` before the next publish. Re-record after a release that
changes the scaffold's output or the chrome the second half shows; `docs/reference/operations.md`
says so beside the tour's paragraph.

**One theme, dark.** The tour is recorded in both themes because it sits on a page that switches
theme. The screencast is half terminal, which has no light theme worth showing, and it sits below
the fold. One file set, dark, with a poster; the landing page figure does not use the theme
switcher.

**The README gets the poster, the site gets the video.** A ninety-second GIF at the tour's encoding
would weigh over ten megabytes, and GitHub embeds no `<video>`. The README shows the poster still
under the Quick start, linking to the landing page's figure. The GIF is produced for the site and
for posts, not for the README. `quick-start-light.png`, the existing still of the result, is
removed once nothing references it, or kept if the getting-started guide reads better with both;
the tasks decide by reading the page.

**Placement follows the claim.** Landing page: after the Quick start section, in the same
`figure.shot` styling as the tour. `docs/getting-started.md`: after the introductory paragraph,
before the first step. README: the poster under the Quick start's code block, before "That is the
whole list". The primary CTA on the landing page ("Start in 5 minutes") stays: it already points at
the page the recording opens.

**Closing caption.** *This is the application shell your product can grow into.* Taken from the
review, kept because it ties the developer's path back to the headline of
`position-as-angular-plugin-platform`.

## Risks / Trade-offs

- [The install step is slow and network-bound] → The transcript keeps the real duration and the
  caption states it; a local npm cache makes the second run fast. The recorder does not mock the
  install, because a fake install is a fake claim.
- [Ninety seconds is not enough for both halves] → The terminal half is a replay and takes as long
  as the recorder chooses, under thirty seconds; the browser half shows three things in under
  forty. Measured, not assumed; the task says so.
- [The recording goes stale with the next CLI release] → Same as the tour: the operations note says
  when to re-record, and the tag check makes a stale recording obvious at recording time rather
  than on the front page.
- [The transcript replay looks fake] → It shows the real output of the real commands with the real
  durations stated. What it removes is waiting, and the caption says so.

## Migration Plan

Implemented on a branch after a release, so the recording shows that release. The PR carries the
tool, the media, the placements and the guard in one step; the site deploys from `main`. Rollback
is a revert.

## Open Questions

- Whether `docs/getting-started.md` keeps the still of the result beside the recording, or the
  poster replaces it. Decided at task time by what the page reads like with both.
