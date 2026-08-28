## 1. Stop stating the default change detection

- [x] 1.1 Removed from **70** components in `platform/` via a TypeScript-parser pass, each with its
      now-unused import. The proposal said 75; the other 5 were not components at all but occurrences
      inside `@loom/devkit`'s template literals, which 1.3 covers. The grep counted text, the parser
      counted declarations.
- [x] 1.2 Remove the same from the 8 components in `demo/src`.
- [x] 1.3 Removed all 4 from `recipes/angular-weaver/recipe.ts`, along with the
      `ChangeDetectionStrategy` import in each of the 4 emitted files. `recipe.spec.ts` asserted the
      scaffold **contained** `ChangeDetectionStrategy.OnPush`; that assertion is now inverted, because
      a scaffold stating the default teaches a leftover.
- [x] 1.4 Confirm no component declares `ChangeDetectionStrategy.Eager`. If one did, it wanted the
      other strategy and this task would be changing its behaviour.
- [x] 1.5 Verify: zero occurrences of `ChangeDetectionStrategy` remain outside a deliberate
      `Eager`, and the full suite is green.

## 2. Adopt @Service where the class is a root singleton

- [x] 2.1 List the injectables that are **not** root-provided before converting anything. There are
      two; `ShellErrorHandler` in `permissions/capability-refusal.ts` is one, wired by hand as
      `{ provide: ErrorHandler, useClass: ShellErrorHandler }`. These stay `@Injectable()`.
- [x] 2.2 Convert the 70 `@Injectable({ providedIn: 'root' })` classes to `@Service`, matching the
      full form rather than the bare decorator name.
- [x] 2.3 Cross-check the arithmetic: `@Service` count plus remaining `@Injectable` count equals the
      72 that exist today, and the two survivors are the two enumerated in 2.1.
- [x] 2.4 Verify no class gained a second instance scope: the suite is green, and in particular the
      specs that inject a service and assert shared state across injectors.

## 3. Finish inject()

- [x] 3.1 **Withdrawn — the finding was wrong.** None of the three is dependency injection. They are
      parameter properties taking values: a default URL string in a template literal
      (`recipes/settings-store/recipe.ts`), a reader function (`persistence/boot-latched-scope.ts`)
      and a boolean in a spec probe (`regions/pane/surface-close-guard.spec.ts`). `inject()` does not
      apply to any of them, and converting them would have been a defect.
- [x] 3.2 Superseded by 3.1.
- [x] 3.3 Superseded by 3.1.
- [x] 3.4 Verified properly this time, with a parser rather than a grep: across every class carrying
      an Angular decorator, **zero** constructor parameters name an injectable type. Constructor
      injection is already gone; the original count matched the string `constructor(private`, which
      says nothing about DI.

## 4. Check the published surface with the right expectation

- [x] 4.1 **No diff at all**, which is better than the design predicted. Both `@loom/plugin-sdk` and
      `loom-shell.d.ts` are byte-identical to `main`: `@Service()` and
      `@Injectable({ providedIn: 'root' })` emit the same static members, so the declarations do not
      move. The design note expected a diff and was wrong in the harmless direction.
- [x] 4.2 Confirm no exported name is added, removed or retyped. Read any diff beyond
      compiler-generated members line by line.
- [x] 4.3 `npm run api-docs-check`, `package-exports-check`, `comments-check` and
      `import-cycles-check` are green.

## 5. Verify

- [x] 5.1 `npx nx run-many --target=lint --target=test --target=build --all` green in `platform/`,
      cache skipped.
- [x] 5.2 `npm run lint`, `npm run build` and `npm test` green in `demo/`.
- [x] 5.3 The devkit suite covers the emitted output and passes: 19 files, 187 tests, including the
      inverted assertion from 1.3.
- [x] 5.4 `openspec validate --all --strict` passes.
- [x] 5.5 Nightly run 19407 against `main` `fbb0d77a`: **293 e2e tests passed**, plus 53 demo
      smoke tests, and the app was driven by hand in a browser beforehand. This was the
      confirmation that mattered: change detection passes a TestBed and fails a browser, and 1,288
      green specs could not have told us.
