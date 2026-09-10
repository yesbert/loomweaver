## 1. A check reports what it found

- [x] 1.1 Give the check a typed outcome and return it from every branch, including the one where
      there is no offline machinery.
- [x] 1.2 Test each outcome, including that an unanswerable check differs from a current one.

## 2. The last check is readable

- [x] 2.1 Record what the last check found, when, and whether the workbench made it by itself.
- [x] 2.2 Record the automatic check the same way, including the one that finds nothing.
- [x] 2.3 Test both.

## 3. A distribution may announce for itself

- [x] 3.1 Add the composition option that says the product announces, beside the one that says
      whether the offline machinery is registered.
- [x] 3.2 Put every notice about updates behind it, the manual ones and the automatic ones.
- [x] 3.3 Test that nothing is shown where the product announces, that what the workbench knows stays
      readable, and that saying nothing keeps every notice.

## 4. Close it out

- [x] 4.1 Document the three, in the guide for products and in the machine-readable contract.
- [x] 4.2 Run the shell's tests, the packaging gate and the repository's guards.
