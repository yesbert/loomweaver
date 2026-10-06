## 1. The check

- [x] 1.1 Generate the feature matrix for every scaffold in memory
- [x] 1.2 Type-check every emitted TypeScript file against the packed SDK and shell declarations; parse every emitted template
- [x] 1.3 Run the frame plugin's scripts against recording stand-ins of the kit and the transport
- [x] 1.4 A missing build step is reported by name

## 2. Wiring

- [x] 2.1 The check runs in the pull-request build after packaging; its run time is recorded in the PR
- [x] 2.2 The operations reference lists the guard and how to run it locally
