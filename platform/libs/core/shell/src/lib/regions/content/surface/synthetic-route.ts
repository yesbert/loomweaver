import { ActivatedRoute, UrlSegment, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { RegisteredView } from '../../../plugin/contribution-registry';

interface SyntheticRouteInput {
  readonly url: UrlSegment[];
  readonly params: Record<string, string>;
  readonly data: Record<string, unknown>;
}

function buildSyntheticRoute({
  url,
  params,
  data,
}: SyntheticRouteInput): ActivatedRoute {
  const paramMap = convertToParamMap(params);
  const emptyMap = convertToParamMap({});
  const snapshot: Record<string, unknown> = {
    url,
    params,
    paramMap,
    queryParams: {},
    queryParamMap: emptyMap,
    fragment: null,
    data,
    outlet: 'primary',
    component: null,
    routeConfig: null,
    title: undefined,
    parent: null,
    firstChild: null,
    children: [],
  };
  snapshot['pathFromRoot'] = [snapshot];
  snapshot['root'] = snapshot;
  return {
    snapshot,
    url: of(url),
    params: of(params),
    paramMap: of(paramMap),
    queryParams: of({}),
    queryParamMap: of(emptyMap),
    fragment: of(null),
    data: of(data),
    title: of(undefined),
    outlet: 'primary',
    component: null,
    routeConfig: null,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [],
  } as unknown as ActivatedRoute;
}

export function syntheticParamRoute(
  params: Record<string, string>,
): ActivatedRoute {
  return buildSyntheticRoute({ url: [], params, data: {} });
}

export function syntheticDockedRoute(
  view: RegisteredView,
  instanceId: string,
  params: Record<string, string> = {},
): ActivatedRoute {
  return buildSyntheticRoute({
    url: [],
    params,
    data: {
      ...(view.iframe !== undefined && { iframe: view.iframe }),
      ...(view.pluginId && { pluginId: view.pluginId }),
      docked: true,
      instanceId,
    },
  });
}
