## 1. Decide what the earlier record left open

- [ ] 1.1 Decide whether the coarse capability names can be worded well enough for an end user to
  consent to, or whether the prompt needs a finer set. This gates the rest.
- [ ] 1.2 Decide the granularity at which a declined request is remembered.
- [ ] 1.3 Decide whether a distribution may opt a composed plugin into being asked.

## 2. Build

- [ ] 2.1 A refusal for a user-installed plugin raises a request rather than only a notice.
- [ ] 2.2 A grant given at the point of use is recorded like any other and stays revocable.
- [ ] 2.3 A decline is remembered at the decided granularity and is not re-asked.
- [ ] 2.4 A request is never raised for something the distribution did not allow.

## 3. Verify

- [ ] 3.1 Tests for each scenario of the modified requirement, including the two negative ones.
- [ ] 3.2 An end-to-end case covering install, refusal, grant and revocation of the same capability.
