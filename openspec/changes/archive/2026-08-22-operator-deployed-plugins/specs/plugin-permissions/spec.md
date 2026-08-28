## MODIFIED Requirements

### Requirement: The user may revoke a granted capability, and it takes effect at once

A user SHALL be able to withdraw any capability a plugin was granted. The withdrawal SHALL apply
from the plugin's next use of that part of the context, without a reload, and SHALL survive a
restart. Restoring it SHALL work the same way.

A user SHALL NOT be able to grant beyond what the distribution allowed — revocation only ever
subtracts.

Where a plugin was deployed by the operator rather than chosen by the user, the permissions surface
SHALL state what it holds and SHALL NOT offer to withdraw it. Withdrawing a capability such a plugin
was issued with does not restrain software the user is answerable for; it breaks software they were
given, in a way they cannot be expected to connect to the switch they pressed.

#### Scenario: Revocation applies without a reload

- **WHEN** the user revokes a capability from an active plugin
- **THEN** the plugin's next use of that part of the context is refused

#### Scenario: A revocation survives a restart

- **WHEN** the application starts and a capability was previously revoked
- **THEN** it is still withheld

#### Scenario: Restoring returns the capability

- **WHEN** the user restores a revoked capability
- **THEN** the plugin may use that part of the context again

#### Scenario: Revocation cannot widen a grant

- **WHEN** the user views the permissions of a plugin
- **THEN** only capabilities the distribution granted can be switched at all

#### Scenario: A deployed plugin's permissions are shown but not switchable

- **WHEN** the user views the permissions of a plugin the operator deployed
- **THEN** what it holds is stated, and no switch to withdraw it is offered
