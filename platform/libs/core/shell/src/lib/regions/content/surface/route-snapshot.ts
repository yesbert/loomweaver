import {
  Data,
  Params,
  Route,
  UrlSegment,
  convertToParamMap,
} from '@angular/router';

export interface RouteSnapshotFields {
  readonly url: UrlSegment[];
  readonly params: Params;
  readonly queryParams: Params;
  readonly fragment: string | null;
  readonly data: Data;
  readonly routeConfig: Route | null;
}

export function routeSnapshot(
  fields: RouteSnapshotFields,
): Record<string, unknown> {
  return {
    url: fields.url,
    params: fields.params,
    paramMap: convertToParamMap(fields.params),
    queryParams: fields.queryParams,
    queryParamMap: convertToParamMap(fields.queryParams),
    fragment: fields.fragment,
    data: fields.data,
    outlet: 'primary',
    component: null,
    routeConfig: fields.routeConfig,
    title: undefined,
    parent: null,
    firstChild: null,
    children: [],
  };
}
