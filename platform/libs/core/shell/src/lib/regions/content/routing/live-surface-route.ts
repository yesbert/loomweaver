import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Data,
  ParamMap,
  Params,
  UrlSegment,
  convertToParamMap,
} from '@angular/router';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { paramsOfPattern, segmentsOf } from '../content-path';
import { RegisteredContentRoute } from '../../../plugin/contribution-registry';

export interface SurfaceAddress {
  readonly path: string;
  readonly carriesAddress: boolean;
  readonly queryParams: Params;
  readonly fragment: string | null;
}

export interface LiveSurfaceRoute {
  readonly route: ActivatedRoute;
  update(address: SurfaceAddress): void;
}

interface RouteState {
  readonly url: UrlSegment[];
  readonly params: Params;
  readonly queryParams: Params;
  readonly fragment: string | null;
  readonly data: Data;
  readonly subUrl: UrlSegment[];
}

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

function toSegments(paths: readonly string[]): UrlSegment[] {
  return paths.map((path) => new UrlSegment(path, {}));
}

function stateOf(
  route: RegisteredContentRoute,
  instanceId: string | undefined,
  address: SurfaceAddress,
): RouteState {
  const pattern = segmentsOf(route.path);
  const all = segmentsOf(address.path);
  const sub = all.slice(pattern.length);
  return {
    url: toSegments(all.slice(0, pattern.length)),
    params: paramsOfPattern(route.path, address.path),
    queryParams: address.queryParams,
    fragment: address.fragment,
    subUrl: toSegments(sub),
    data: {
      ...('iframe' in route && { iframe: route.iframe }),
      ...('container' in route && { container: route.container }),
      ...(route.pluginId && { pluginId: route.pluginId }),
      ...(route.rest === true && { rest: true }),
      ...(sub.length > 0 && { sub: sub.join('/') }),
      ...(address.carriesAddress && { urlDriven: true }),
      ...(instanceId && { instanceId }),
    },
  };
}

function snapshotOf(
  state: RouteState,
  child: Record<string, unknown> | null,
): ActivatedRouteSnapshot {
  const paramMap = convertToParamMap(state.params);
  const queryParamMap = convertToParamMap(state.queryParams);
  const snapshot: Record<string, unknown> = {
    url: state.url,
    params: state.params,
    paramMap,
    queryParams: state.queryParams,
    queryParamMap,
    fragment: state.fragment,
    data: state.data,
    outlet: 'primary',
    component: null,
    routeConfig: null,
    title: undefined,
    parent: null,
    firstChild: child,
    children: child ? [child] : [],
  };
  snapshot['pathFromRoot'] = [snapshot];
  snapshot['root'] = snapshot;
  if (child) {
    child['parent'] = snapshot;
    child['root'] = snapshot;
    child['pathFromRoot'] = [snapshot, child];
  }
  return snapshot as unknown as ActivatedRouteSnapshot;
}

function childSnapshotOf(state: RouteState): Record<string, unknown> | null {
  if (state.subUrl.length === 0) {
    return null;
  }
  return {
    url: state.subUrl,
    params: {},
    paramMap: convertToParamMap({}),
    queryParams: state.queryParams,
    queryParamMap: convertToParamMap(state.queryParams),
    fragment: state.fragment,
    data: { sub: true },
    outlet: 'primary',
    component: null,
    routeConfig: null,
    title: undefined,
    firstChild: null,
    children: [],
  };
}

function view<T>(state: Observable<RouteState>, pick: (s: RouteState) => T) {
  return state.pipe(map(pick), distinctUntilChanged<T>(same));
}

export function liveSurfaceRoute(
  route: RegisteredContentRoute,
  initial: SurfaceAddress,
  instanceId?: string,
): LiveSurfaceRoute {
  const state$ = new BehaviorSubject(stateOf(route, instanceId, initial));
  const child$ = view(state$, (s) => s.subUrl);
  const queryParams$ = view(state$, (s) => s.queryParams);
  const fragment$ = view(state$, (s) => s.fragment);
  const snapshot = (): ActivatedRouteSnapshot => {
    const state = state$.value;
    return snapshotOf(state, childSnapshotOf(state));
  };
  const params$ = view(state$, (s) => s.params);
  const live: Record<string, unknown> = {
    url: view(state$, (s) => s.url),
    params: params$,
    paramMap: params$.pipe(map((p): ParamMap => convertToParamMap(p))),
    queryParams: queryParams$,
    queryParamMap: queryParams$.pipe(map((p) => convertToParamMap(p))),
    fragment: fragment$,
    data: view(state$, (s) => s.data),
    title: new BehaviorSubject<string | undefined>(undefined),
    outlet: 'primary',
    component: null,
    routeConfig: null,
    parent: null,
    children: [],
  };
  const childRoute: Record<string, unknown> = {
    url: child$,
    params: new BehaviorSubject<Params>({}),
    paramMap: new BehaviorSubject(convertToParamMap({})),
    queryParams: queryParams$,
    queryParamMap: queryParams$.pipe(map((p) => convertToParamMap(p))),
    fragment: fragment$,
    data: new BehaviorSubject<Data>({ sub: true }),
    outlet: 'primary',
    component: null,
    routeConfig: null,
    parent: live,
    firstChild: null,
    children: [],
  };
  Object.defineProperties(childRoute, {
    snapshot: { get: () => snapshot().firstChild },
  });
  Object.defineProperties(live, {
    snapshot: { get: snapshot },
    firstChild: {
      get: () => (state$.value.subUrl.length > 0 ? childRoute : null),
    },
    root: { get: () => live },
    pathFromRoot: { get: () => [live] },
  });
  return {
    route: live as unknown as ActivatedRoute,
    update(address) {
      const next = stateOf(route, instanceId, address);
      if (!same(next, state$.value)) {
        state$.next(next);
      }
    },
  };
}
