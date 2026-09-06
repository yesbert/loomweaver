## 1. The decision, where the router already makes one

- [x] 1.1 Before an unmatched address falls through to the starting screen, ask whether a workspace
      claims it; where one does, make that workspace active and show the explanation at the address.
- [x] 1.2 Leave the waiting path untouched: an address still being waited for explains nothing.

## 2. What it must keep true

- [x] 2.1 Unit tests: a claimed address nothing answers lands in its workspace with the explanation;
      an unclaimed one keeps today's outcome; waiting stays quiet; what is shown instead does not
      enter the workspace's remembered arrangement.
- [x] 2.2 A test for the case that started this: an address whose plugin was removed behaves like any
      other unanswered claimed address.
- [x] 2.3 End-to-end over the testbed: open a claimed address nothing answers and read back which
      workspace is active and what stands at the address.

## 3. What it touches elsewhere

- [x] 3.1 Check the demo against it: opening the payment matching address without the plugin lands in
      Finance with the explanation, rather than in Overview.
- [x] 3.2 Read the routing guide for what it says about an unanswered address, and correct it where
      this change makes it wrong. **Nothing to correct:** no guide states where an unanswered
      address leaves the user, so none of them was made wrong by this.
