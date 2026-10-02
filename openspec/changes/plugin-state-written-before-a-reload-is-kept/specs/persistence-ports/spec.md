## ADDED Requirements

### Requirement: A held write is not lost to leaving the page

Where the workbench holds a write back to spare the store — a plugin's private store and a surface
instance's state — it SHALL send every write still held when the page is reloaded, closed or
navigated away from, in the main window and in a detached window alike. It SHALL also bound the
wait: while writes to one key keep arriving, the latest value SHALL be sent no later than two
seconds after the first write that was held, and the holding begins again from there.

A value that was cleared or reset while a write for it was held SHALL stay cleared; leaving the page
SHALL NOT bring it back.

The limit of that: the workbench sends the write before the page goes. Whether a store that answers
only asynchronously completes it is that store's to ensure, since the page no longer exists to wait
for the answer. With the built-in local store the value is there on the next load.

#### Scenario: A value written just before a reload is there afterwards

- **WHEN** a plugin writes a key of its private store and the page is reloaded at once, with the
  built-in local store
- **THEN** the plugin reads that value back after the reload

#### Scenario: A surface instance's state written just before a reload is there afterwards

- **WHEN** a surface writes its instance state and the page is reloaded at once, with the built-in
  local store
- **THEN** the instance finds that state after the reload

#### Scenario: Continuous writing still reaches the store

- **WHEN** a plugin writes one key again and again at intervals shorter than the holding time
- **THEN** the store receives the latest value no later than two seconds after the first of those
  writes, and again within every two seconds for as long as they continue

#### Scenario: A cleared value is not written back on leaving

- **WHEN** a plugin writes a key, clears it while the write is still held, and the page is left
- **THEN** the store holds no value for that key

#### Scenario: A quiet key is written once

- **WHEN** a plugin writes a key several times in quick succession and then stops
- **THEN** the store receives one write, carrying the last value
