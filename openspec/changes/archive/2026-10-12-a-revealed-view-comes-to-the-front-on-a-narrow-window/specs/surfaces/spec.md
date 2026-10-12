## ADDED Requirements

### Requirement: A plugin can bring a docked surface to the front

A plugin SHALL be able to ask the workbench to bring a surface it docked to the front by the
surface's identity. The workbench SHALL make that surface current where it stands, in a side panel
or in the content area, and SHALL put it in view: a collapsed side panel SHALL be expanded, and on a
window narrow enough for side panels to be overlays the panel's overlay SHALL be opened. This SHALL
hold whether or not the panel has been drawn in the session, so a surface declared for a panel is
found there before the person has ever opened it.

The limits: a surface the person hid, a surface no plugin declares, and one that is placed nowhere
are left alone and nothing happens. A surface that lives only inside a container, and a surface
reached by its address, are not brought forward this way.

#### Scenario: A collapsed panel is expanded

- **WHEN** a plugin brings forward a surface in a side panel the person has collapsed
- **THEN** the panel is expanded and shows that surface

#### Scenario: A narrow window opens the panel's overlay

- **WHEN** a plugin brings forward a surface in a side panel while the window is narrow enough for
  side panels to be overlays
- **THEN** the panel's overlay opens and shows that surface

#### Scenario: A panel not yet drawn still finds its surface

- **WHEN** a plugin brings forward a surface declared for a side panel in a session in which that
  panel has never been drawn, as on a narrow window before its overlay was first opened
- **THEN** the panel comes into view showing that surface

#### Scenario: A hidden surface stays hidden

- **WHEN** a plugin brings forward a surface the person has hidden
- **THEN** nothing changes
