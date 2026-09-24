import { ActivatedRoute, UrlSegment, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { RegisteredView } from '../../../contributions/contribution-registry';
import { routeSnapshot } from './route-snapshot';
import { SurfaceRouteData } from './surface-route-data';

interface SyntheticRouteInput {
  readonly url: UrlSegment[];
  readonly params: Record<string, string>;
  readonly data: SurfaceRouteData;
}

function buildSyntheticRoute({
  url,
  params,
  data,
}: SyntheticRouteInput): ActivatedRoute {
  const paramMap = convertToParamMap(params);
  const emptyMap = convertToParamMap({});
  const snapshot = routeSnapshot({
    url,
    params,
    queryParams: {},
    fragment: null,
    data,
    routeConfig: null,
  });
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
