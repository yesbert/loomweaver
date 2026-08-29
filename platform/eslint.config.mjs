import { fileURLToPath } from "node:url";
import nx from "@nx/eslint-plugin";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import regexp from "eslint-plugin-regexp";
import unicorn from "eslint-plugin-unicorn";
import * as angularTemplateParser from "@angular-eslint/template-parser";

// Tailwind v4 is CSS-first: the class registry is derived from this entry point
// (@import 'tailwindcss' + @source + @theme). Absolute so it resolves regardless of cwd.
const tailwindEntryPoint = fileURLToPath(
    new URL("apps/loom-testbed/src/styles.css", import.meta.url)
);

export default [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
        ignores: [
            "**/dist",
            "**/out-tsc",
            // Angular's build cache: generated copies of files that are linted at their source.
            "**/.angular"
        ]
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: [
                        String.raw`^.*/eslint(\.base)?\.config\.[cm]?[jt]s$`
                    ],
                    depConstraints: [
                        {
                            // Platform stays domain-pure: never depend on a weaver.
                            sourceTag: "scope:platform",
                            onlyDependOnLibsWithTags: [
                                "scope:platform"
                            ]
                        },
                        {
                            // A weaver may only consume the public contract, no core internals.
                            sourceTag: "scope:weaver",
                            onlyDependOnLibsWithTags: [
                                "scope:weaver",
                                "scope:integration",
                                "type:contract"
                            ]
                        },
                        {
                            // A distribution is the one composition root where the platform meets
                            // its weaver bundles (VS Code's product layer): it may consume the
                            // platform, weavers and the contract to wire a shippable product.
                            sourceTag: "scope:distribution",
                            onlyDependOnLibsWithTags: [
                                "scope:distribution",
                                "scope:platform",
                                "scope:weaver",
                                "scope:integration",
                                "type:contract"
                            ]
                        },
                        {
                            // Runtime adapters to a third-party protocol: may reach the public
                            // contract and each other, never the shell or a weaver. They run in the
                            // user's browser, unlike scope:tooling, which runs while you build.
                            sourceTag: "scope:integration",
                            onlyDependOnLibsWithTags: [
                                "scope:integration",
                                "type:contract"
                            ]
                        },
                        {
                            // Dev-time tooling (the scaffolding devkit): may reach the public
                            // contract for validation, never a weaver's or the shell's internals.
                            sourceTag: "scope:tooling",
                            onlyDependOnLibsWithTags: [
                                "scope:tooling",
                                "type:contract"
                            ]
                        },
                        {
                            sourceTag: "*",
                            onlyDependOnLibsWithTags: [
                                "*"
                            ]
                        }
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        // Override or add rules here
        rules: {}
    },
    {
        // A pattern that can be driven into backtracking is a denial of service waiting for the one
        // input nobody tried. This is the analysis SonarQube runs for the same finding, moved to the
        // pull request: `no-super-linear-move` is not in the plugin's recommended set and carries
        // three of the four patterns this repository had, so it is named here on purpose.
        // Test files are exempt: a pattern in a spec never meets an input it did not choose.
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        ignores: [
            "**/*.spec.ts",
            "**/*.spec.js"
        ],
        plugins: { regexp },
        rules: {
            "regexp/no-super-linear-backtracking": "error",
            "regexp/no-super-linear-move": "error"
        }
    },
    {
        // Modern JavaScript, enforced rather than written down: the API that exists now over the
        // one it replaced, a condition without a needless negation, a Set where membership is what
        // is asked. SonarQube ships a large part of this set as its own S77xx rules, which is how
        // most of the 93 issues cleared in August arrived in the first place; here they are caught
        // in the pull request instead of the nightly scan.
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        plugins: { unicorn },
        rules: {
            ...unicorn.configs.recommended.rules,

            // The rules the workspace does not take, each for a reason that outlives its findings:

            // It rewrites a single-line `/** ... */` to `//`, which unmakes every JSDoc line on the
            // published contract — the very lines api-docs-check requires and an IDE reads.
            "unicorn/single-line-block-comment-style": "off",

            // It wants private members first; engineering-standards.md wants the public surface
            // first, so a reader meets the contract before the machinery. member-ordering below
            // enforces ours, and two orders cannot both hold.
            "unicorn/consistent-class-member-order": "off",

            // It wants every boolean to start with is/has/can. Two of its 132 findings are on
            // the published contract (`meetsAccess`, `SettingToggle.value`), where renaming costs
            // a major version, and `SettingToggle.value` is right as it stands: it is the value of
            // the toggle. The rest are domain words — a view is `retained`, a capability is
            // `granted` — and `isRetained` reads no better, only longer.
            "unicorn/consistent-boolean-name": "off",

            // Where a function is declared is the author's call. `consistent-function-scoping`
            // and `isolated-functions` would move 133 helpers out of the closures that name them,
            // and in a component built on signals the closure is often the point: the helper reads
            // like part of the thing it serves. Neither rule describes a defect.
            "unicorn/consistent-function-scoping": "off",
            "unicorn/isolated-functions": "off",

            // `prefer-await` rewrites a `.then` chain into await. Ours sit where awaiting would
            // change when the work runs: a constructor that must not block, a fire-and-forget
            // notification, a chain the caller deliberately does not join.
            "unicorn/prefer-await": "off",

            // It bans `null`. Angular and the DOM hand us `null` (queryParamMap.get, querySelector)
            // and our own signatures return it; banning the literal would only move the seam.
            "unicorn/no-null": "off",

            // It calls `for (const action of view.actions ?? [])` unreadable and wants the
            // iterable hoisted into a named variable. Twenty of its twenty-four findings are
            // that shape, where the name would repeat the loop variable and buy a line.
            "unicorn/no-unreadable-for-of-expression": "off",

            // Three levels of nesting is below what a schema builder and node's path helpers
            // need in one expression: `z.record(z.string(), z.record(...))` is the schema, and
            // `readFileSync(fileURLToPath(new URL(...)), 'utf8')` is how a module reads a file
            // beside itself.
            "unicorn/max-nested-calls": "off",

            // It reorders the operands of && and ||, which puts the cheap test first and the
            // intent second: `option.type === 'string' && typeof value !== 'string'` states a
            // mismatch, and the reverse states nothing. Its own message asks the reader to
            // verify short-circuit behaviour, which makes it a prompt rather than a rule.
            "unicorn/prefer-simple-condition-first": "off",

            // It reads `if (x) setAttribute(a, v) else removeAttribute(a)` as a toggle. Both of
            // ours carry a value a reader depends on — an aria-checked of "true" or "false", the
            // reflected value of a custom element property — and `toggleAttribute` cannot carry one.
            "unicorn/prefer-toggle-attribute": "off",

            // It rewrites `.then(onValue, onRejection)` into `.then().catch()`, which widens what
            // the handler sees to include a failure of onValue. All four of ours name the rejection
            // they report ("surfaceBeforeClose() rejected", "surface failed to load"), and a
            // widened catch would file the wrong failure under that message.
            "unicorn/prefer-then-catch": "off",

            // `Number()` is not `Number.parseInt()` where the string has a numeric prefix and a
            // tail: a semver prerelease ("3-beta") and a CSS duration ("0.2s") are exactly that,
            // and both of ours read the prefix on purpose.
            "unicorn/prefer-number-coercion": "off",

            // It wants `import path from 'node:path'` where the workspace imports names from
            // every other module. One convention read consistently beats a second one that is
            // right only about Node's built-ins.
            "unicorn/import-style": "off",

            // It objects to a module-scoped cache or callback slot being written from inside a
            // function. Ours are exactly that on purpose: a memoised stylesheet, a hook a host
            // hands the weaver once. Wrapping them in an object renames the module state without
            // removing it, which is the thing the rule is actually about.
            "unicorn/no-top-level-assignment-in-function": "off",

            // `dataset` lives on HTMLElement, and these call sites hold an Element.
            "unicorn/dom-node-dataset": "off",

            // It assumes a property named `size` is never negative; ours is a percentage from a
            // plugin declaration, and its fixer turned `size <= 0` into `size === 0`, which
            // stopped reporting negative sizes.
            "unicorn/explicit-length-check": "off",

            // `globalThis.X` yields undefined where a bare `X` throws a ReferenceError, which is
            // exactly what a test that stubs a global relies on.
            "unicorn/no-unnecessary-global-this": "off",

            // `getHTML()` is a 2024 DOM API that jsdom does not have, so the tests that read
            // rendered markup fail on it.
            "unicorn/prefer-dom-node-html-methods": "off",

            // Abbreviations are expanded, except the ones that are names rather than shorthand:
            // `ctx` is what every plugin author knows the context by, `args`, `ref` and `deps` sit
            // in the published contract or in type names built on it.
            // Off for now: what its fixer could rename safely is renamed, and the 50 left
            // need a reader. `e` is an event in one place and an entry in the next, and the
            // rule offers `event_` for both.
            "unicorn/name-replacements": [
                "off",
                {
                    // A filename follows the framework that reads it: proxy.conf.js is what
                    // Angular looks for, and renaming it would only break the reference.
                    checkFilenames: false,
                    replacements: {
                        arg: false,
                        args: false,
                        ctx: false,
                        dep: false,
                        deps: false,
                        param: false,
                        params: false,
                        prop: false,
                        props: false,
                        ref: false,
                        refs: false,
                        // Where the rule offers several spellings it cannot choose between,
                        // the workspace names one so the fix is not left to whoever reads it.
                        dir: { directory: true },
                        str: { text: true }
                    }
                }
            ],

            // `f(undefined)` is not `f()` when the parameter is required, and `() => undefined`
            // may not become `() => {}` while no-empty-function forbids exactly that.
            "unicorn/no-useless-undefined": [
                "error",
                { checkArguments: false, checkArrowFunctionBody: false }
            ],

            // Everything below waits on ES2025 in the browser, not on anyone's time.
            // Iterator.prototype.toArray and Promise.try need Safari 18.2 or 18.4, and most of
            // the findings are in code that ships to a browser rather than to node. Raising the
            // language target would enforce these three at the cost of a support floor, for a
            // gain that is one intermediate array nobody measures. Turn them on when the floor
            // moves for a reason of its own.
            "unicorn/prefer-promise-try": "off",
            "unicorn/prefer-iterator-helpers": "off",
            "unicorn/prefer-iterator-to-array": "off",
        }
    },
    {
        // Three rules whose whole subject is production robustness, switched off for test code
        // rather than left off everywhere. A spec assigns a global because stubbing one is what
        // it is testing, reads a member off an await because the extra line buys nothing in an
        // assertion, and searches a mounted host without `:scope` because the host is the
        // fixture. Enforced for everything that ships.
        files: [
            "**/*.spec.ts",
            "**/*.spec.js"
        ],
        rules: {
            "unicorn/no-await-expression-member": "off",
            "unicorn/no-global-object-property-assignment": "off",
            "unicorn/prefer-scoped-selector": "off"
        }
    },
    {
        // A `continue` guarding the top of an inner loop is not the ambiguity this rule is named
        // for, and these ten are all that shape, in a file walker and in Tarjan's algorithm where
        // inverting them would nest the body a level deeper. The shape that IS ambiguous, a break
        // inside a switch inside a loop, is gone from everything that ships and stays enforced.
        files: [
            "**/tools/**"
        ],
        rules: {
            "unicorn/no-break-in-nested-loop": "off"
        }
    },
    {
        // Angular's dev server reads this file with require(), so CommonJS is what it has to be.
        files: [
            "**/proxy.conf.js"
        ],
        rules: {
            "unicorn/prefer-module": "off"
        }
    },
    {
        // `no-process-exit` names its own exception: a CLI app. These are the CLI entry points,
        // where a script that cannot do its job exits with a status the shell reads, and throwing
        // would print a stack trace at a user who asked for a certificate.
        files: [
            "**/tools/**"
        ],
        rules: {
            "unicorn/no-process-exit": "off"
        }
    },
    {
        // The frame kit publishes its API on the global on purpose: that assignment is how a
        // sandboxed plugin document reaches the host at all.
        files: [
            "**/lw-elements.frame.ts"
        ],
        rules: {
            "unicorn/no-global-object-property-assignment": "off",
            "unicorn/no-top-level-side-effects": "off"
        }
    },
    {
        // House member order (engineering-standards.md): fields -> constructor ->
        // methods public -> protected -> private. Accessors sort with the methods
        // of their visibility; a property holding an arrow function counts as a
        // method of its visibility (the rule's own classification).
        files: [
            "**/*.ts",
            "**/*.tsx"
        ],
        rules: {
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    default: {
                        memberTypes: [
                            "signature",
                            "field",
                            "constructor",
                            ["public-get", "public-set", "public-method"],
                            ["protected-get", "protected-set", "protected-method"],
                            ["private-get", "private-set", "private-method", "#private-method"]
                        ]
                    }
                }
            ]
        }
    },
    {
        // Tailwind guardrail on Angular templates (see docs/reference/design-tokens.md):
        // catch typo'd / non-existent utility classes (Tailwind ignores them silently)
        // and keep class order stable. Own hand-written CSS classes use the `lw-` prefix.
        files: ["**/*.html"],
        languageOptions: { parser: angularTemplateParser },
        plugins: { "better-tailwindcss": betterTailwindcss },
        settings: {
            "better-tailwindcss": {
                entryPoint: tailwindEntryPoint,
                // Only the static `class` attribute. Angular `[class.x]="expr"` bindings
                // carry the class in the attribute *name*; their value is a boolean
                // expression whose string literals would otherwise be misread as classes.
                attributes: ["class"]
            }
        },
        rules: {
            "better-tailwindcss/no-unknown-classes": [
                "error",
                { ignore: ["^lw-"] }
            ],
            "better-tailwindcss/enforce-consistent-class-order": "warn"
        }
    }
];
