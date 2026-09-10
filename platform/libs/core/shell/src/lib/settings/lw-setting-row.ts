import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

/**
 * One settings row: an optional leading `icon`, the label (+ optional description) on the left, the
 * control projected on the right. A pure layout primitive — the host slots the matching control
 * (`<lw-select>`, later toggle/button) via content projection. The icon is named from the icon
 * registry like every other `icon` field and is decoration only: the label is what names the row.
 */
@Component({
  selector: 'lw-setting-row',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './lw-setting-row.html',
})
export class LwSettingRow {
  readonly label = input('');
  readonly description = input('');
  readonly icon = input('');
}
