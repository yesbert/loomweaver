import { ActivatedRoute, UrlSegment, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { paramsOfPattern, segmentsOf } from '../content-path';
import {
  RegisteredContentRoute,
  RegisteredView,
} from '../../../plugin/contribution-registry';

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

export interface SyntheticRouteOptions {
  readonly urlDriven?: boolean;
  readonly instanceId?: string;
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

export function syntheticRouteFor(
  route: RegisteredContentRoute,
  path: string,
  options: SyntheticRouteOptions = {},
): ActivatedRoute {
  const pattern = segmentsOf(route.path);
  const allSegments = segmentsOf(path);
  const segments = allSegments.slice(0, pattern.length);
  const sub = allSegments.slice(pattern.length).join('/');
  const params = paramsOfPattern(route.path, path);
  return buildSyntheticRoute({
    url: segments.map((segment) => new UrlSegment(segment, {})),
    params,
    data: {
      ...('iframe' in route && { iframe: route.iframe }),
      ...('container' in route && { container: route.container }),
      ...(route.pluginId && { pluginId: route.pluginId }),
      ...(route.rest === true && { rest: true }),
      ...(sub && { sub }),
      ...(options.urlDriven && { urlDriven: true }),
      ...(options.instanceId && { instanceId: options.instanceId }),
    },
  });
}
