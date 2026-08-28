## Context

See proposal.md for why this exists. The design-relevant facts are these.

The analysis runs against the project `loomweaver` on `sonar.stratara.tech`, nightly and on every
push to `main`, and since the move it waits for the quality gate. The gate fails on two conditions:
`new_violations` must be 0 and it is 83, and `new_security_hotspots_reviewed` must be 100% and it
is 0%.

Both conditions are about *new* code, and every line is new code. The scanner now runs with
`projectBaseDir: platform`, so a file that was `platform/libs/core/shell/...` before the move is
`libs/core/shell/...` now. Sonar keys issues by path, so the old bodies are gone and the same
findings came back as fresh ones. That was the price of making coverage resolve, and it is paid.

The consequence matters for this design: there is no old-versus-new distinction to hide behind. The
83 are the whole project, and the gate can only go green when the number reaches zero.

Sonar is not in the merge gate. `build.yml` decides whether a pull request may land, and a red
Sonar run blocks nothing. The work can take as long as it takes.

## Goals / Non-Goals

**Goals:**

- One recorded decision per finding, in the repository, where a reviewer can read it.
- The gate green because the findings are gone, not because the measurement was moved.
- Fixes small enough to review, grouped so a reviewer judges one idea at a time.

**Non-Goals:**

- Raising or relaxing any gate threshold.
- Touching `.github/workflows/sonar.yml`.
- Improving coverage. It sits at 84.9% against a threshold of 80% and is not what fails.
- Reducing the finding count for its own sake. A finding correctly answered with "no" counts as
  done.

## Decisions

**Triage by rule, not by file or by severity.** The 83 findings come from 27 rules, and 24 of them
are one rule in 12 files. A judgement about a rule usually settles every instance of it at once,
whereas walking the list file by file asks the same question 24 times. Severity was rejected as the
axis because it is Sonar's weighting of a generic rule, not ours of this code: the two BLOCKERs are
genuinely the most valuable finding in the list, but a MINOR duplicate import is worth more of our
attention than a CRITICAL complexity score on a validator that is complex because validation is.

**Three outcomes, and the "no" is written in the repository.** Fix it, exempt it in
`platform/sonar-project.properties` with the reason in a comment above the criterion, or lift it out
as its own defect change. Sonar's own interface offers a fourth path, marking an issue "won't fix"
on the server, and it is rejected: a decision that lives only in a database cannot be read in a
review, cannot be diffed, and does not survive the project being recreated. The ten exemptions in
that file today are the form to follow, each naming one rule and one file, each with its reasoning
and the date it was reviewed.

**Never a blanket suppression.** No rule is switched off across the codebase, and no exemption uses
a pattern broader than the file it is about. The cost is a longer properties file. The benefit is
that the next occurrence of the same rule in a different file still shows up and gets its own
decision.

**`S2871` is decided per call site, and the default is to leave it alone.** The rule asks for a
comparator on `.sort()`. Where the result is shown to a person, a locale-aware comparator is right.
Where the result is serialized, as in `hidden-views.service.ts` and `workspace-definition.ts`, it is
wrong: the stored string would depend on the browser's language, so the same profile would read
differently in a German and an English session. Each of the seven is classified as display or
storage before anything is changed.

**Complexity findings are refactored only where the code gets clearer.** `S3776`, `S2004` and
`S3800` flag three functions above a threshold. Where a function is tangled, untangling it is the
fix. Where it is long because it exhaustively validates something, splitting it into fragments that
only make sense together makes the code worse to satisfy a number, and it gets an exemption instead.
Raising the threshold globally was considered and rejected: it would hide the next function that
grows for a bad reason.

**No new-code baseline is set.** Moving the baseline forward would make all 83 old, and the gate
would go green tomorrow with nothing decided. That is precisely the mechanism by which these
findings stayed invisible, in a different form. Driving the count to zero makes a baseline
unnecessary, because from then on any red gate is genuinely about code we just wrote. The trade-off
is that the gate stays red for the duration of this change, which costs nothing since Sonar does not
gate merges. If triage lifts a finding out into its own defect change that will not land soon, the
baseline is reconsidered then, deliberately and with a reason.

**The security hotspots are reviewed in Sonar, and what was decided is written here.** Review state
is server-side and there is no file that can hold it. The compensation is that each hotspot's
verdict is recorded in this change's tasks, so the repository still says what was concluded and why.

## Risks / Trade-offs

- **The exemption file becomes a graveyard.** → Every entry names one rule and one file and carries
  its reason. An entry nobody can justify in a sentence is a fix, not an exemption.
- **The duplicate-import slice touches twelve files at once and conflicts with concurrent work.** →
  It is mechanical and reviewable in minutes, so it goes first and lands quickly rather than sitting
  open.
- **Triage produces a defect that cannot be fixed inside this change.** → It leaves as its own
  change, and the gate stays red until it lands. That is the honest state, and the baseline decision
  is revisited only if the wait becomes long.
- **A rule update in a future Sonar version introduces new findings after this is done.** → The
  nightly run reports them by name on the run summary, and against a zero baseline they are
  unambiguous. This is the state the work is buying.
- **The two assertion-less tests may be hiding a broken test rather than a missing line.** → Adding
  an assertion may turn a passing test red. If it does, that is a finding, not an obstacle, and it
  is treated as one.

## Migration Plan

No deployment and nothing to roll back. The sequence is the only ordering that matters:

1. Triage every finding on paper first, so the decisions exist before any code moves.
2. The mechanical slice (`S3863`) lands first and removes 24 of the 83.
3. The correctness slices follow: the assertion-less tests, `S6959`, `S4123`, `S6551`.
4. The judgement slices last: `S2871`, then the complexity findings.
5. The hotspots are reviewed once, at the end, together.
6. The final run is checked for a green gate. If it is not green, the remainder is named.
