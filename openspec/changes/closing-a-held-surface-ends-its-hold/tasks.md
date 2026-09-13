## 1. Closing a held surface ends its hold

- [x] 1.1 Write a failing test: a held surface is closed and its view is shown again; the hold reads
      off and the new component is in its place.
- [x] 1.2 End the hold when the stash destroys the last entry holding it.

## 2. Every declared panel width is a positive number

- [x] 2.1 Write a failing test: a start, narrowest or widest width of zero, a negative number, NaN or
      Infinity is refused at composition, naming the region.
- [x] 2.2 Check every declared width before the bounds are compared.

## 3. Saying it where consumers read

- [x] 3.1 Update the distribution layout guide, the view state guide and the brief where they describe
      the refused widths and closing a held surface.

## 4. Closing

- [x] 4.1 Run the unit suites and the repository guards.
- [x] 4.2 Run `openspec validate --all --strict`.
