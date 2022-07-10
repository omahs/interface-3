import { AmmPool as BaseAmmPool } from '@ergolabs/ergo-dex-sdk';
import { DateTime } from 'luxon';
import {
  catchError,
  combineLatest,
  defaultIfEmpty,
  filter,
  from,
  map,
  Observable,
  of,
  publishReplay,
  refCount,
  retry,
  switchMap,
  zip,
} from 'rxjs';

import { applicationConfig } from '../../../../applicationConfig';
import { AmmPool } from '../../../../common/models/AmmPool';
import { getAggregatedPoolAnalyticsDataById24H } from '../../../../common/streams/poolAnalytic';
import { verifiedAssets$ } from '../../../../common/streams/verifiedAssets';
import { mapToAssetInfo } from '../common/assetInfoManager';
import { networkContext$ } from '../networkContext/networkContext';
import { getPoolChartDataRaw } from '../poolChart/poolChart';
import { ErgoAmmPool } from './ErgoAmmPool';
import { nativeNetworkPools, networkPools } from './utils';

const getNativeNetworkAmmPools = () =>
  from(nativeNetworkPools().getAll({ limit: 100, offset: 0 })).pipe(
    map(([pools]) => pools),
    retry(applicationConfig.requestRetryCount),
  );

const getNetworkAmmPools = () =>
  from(networkPools().getAll({ limit: 100, offset: 0 })).pipe(
    map(([pools]) => pools),
    retry(applicationConfig.requestRetryCount),
  );

const isPoolVerified = (p: BaseAmmPool, verifiedAssets: string[]): boolean =>
  verifiedAssets.includes(p.assetX.id) && verifiedAssets.includes(p.assetY.id);

const toAmmPool = (p: BaseAmmPool): Observable<AmmPool> =>
  zip([
    getAggregatedPoolAnalyticsDataById24H(p.id).pipe(
      catchError(() => of(undefined)),
    ),
    getPoolChartDataRaw(p.id, {
      from: DateTime.now().minus({ day: 1 }).valueOf(),
    }),
    combineLatest(
      [p.lp.asset, p.x.asset, p.y.asset].map((asset) =>
        mapToAssetInfo(asset.id),
      ),
    ),
    verifiedAssets$,
  ]).pipe(
    map(([poolAnalytics, rawChartData, [lp, x, y], verifiedAssets]) => {
      return new ErgoAmmPool(
        p,
        { lp: lp || p.lp.asset, x: x || p.x.asset, y: y || p.y.asset },
        poolAnalytics,
        rawChartData,
        isPoolVerified(p, verifiedAssets),
      );
    }),
  );

export const ammPools$ = networkContext$.pipe(
  switchMap(() => zip([getNativeNetworkAmmPools(), getNetworkAmmPools()])),
  map(([nativeNetworkPools, networkPools]) =>
    nativeNetworkPools.concat(networkPools),
  ),
  catchError(() => of(undefined)),
  filter(Boolean),
  switchMap((pools) =>
    combineLatest(pools.map(toAmmPool)).pipe(defaultIfEmpty([])),
  ),
  publishReplay(1),
  refCount(),
);
