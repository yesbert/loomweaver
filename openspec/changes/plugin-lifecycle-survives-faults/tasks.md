## 1. A failure reaches only its own activation

- [ ] 1.1 Hand the activation's own context to the failure handler, and undo contributions only
      when that context is still the one stored for the plugin.
- [ ] 1.2 Report a failure from a superseded activation as such, without touching the current one.
- [ ] 1.3 Test that a late rejection of a first activation leaves the contributions of a second,
      healthy activation in place, and is reported.

## 2. Deactivation always completes

- [ ] 2.1 Run the teardown inside a guard so that forgetting the context and releasing the grants
      happen whether or not it throws.
- [ ] 2.2 Make unloading everything collect each teardown failure, continue with the next plugin,
      and report the failures after the last plugin is unloaded, without throwing.
- [ ] 2.3 Test that a throwing teardown still leaves the plugin without contributions, inactive and
      without a grant.
- [ ] 2.4 Test that a throwing teardown in the first plugin does not leave the second plugin's
      contributions behind, and that the failure is reported.

## 3. Namespace declarations accumulate

- [ ] 3.1 Let each declaration contribute to a private multi-provider, and give the published token
      a factory that flattens the contributions in provider order and drops repeated names.
- [ ] 3.2 Update the JSDoc of the declaring function so it says that calls accumulate.
- [ ] 3.3 Test that two declarations yield both names in declaration order, and that a name declared
      twice appears once, through the published token and in the bundles the loader requests.
- [ ] 3.4 Say in the distribution's i18n guide that declarations accumulate, in one sentence.

## 4. Verification

- [ ] 4.1 Run the shell tests and lint for what this touches.
- [ ] 4.2 Run `openspec validate --all --strict`.
