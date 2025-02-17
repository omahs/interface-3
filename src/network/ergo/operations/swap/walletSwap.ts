import { from as fromPromise, Observable, switchMap, timeout } from 'rxjs';

import { applicationConfig } from '../../../../applicationConfig';
import { Currency } from '../../../../common/models/Currency';
import { TxId } from '../../../../common/types';
import { ErgoAmmPool } from '../../api/ammPools/ErgoAmmPool';
import { poolActions } from '../common/poolActions';
import { submitTx } from '../common/submitTx';
import { createSwapTxData } from './createSwapTxData';

export const walletSwap = (
  pool: ErgoAmmPool,
  from: Currency,
  to: Currency,
): Observable<TxId> =>
  createSwapTxData(pool, from, to).pipe(
    switchMap(([swapParams, txContext]) =>
      fromPromise(poolActions(pool.pool).swap(swapParams, txContext)),
    ),
    switchMap((tx) =>
      submitTx(tx, {
        type: 'swap',
        baseAsset: from.asset.id,
        baseAmount: from.toAmount(),
        quoteAsset: to.asset.id,
        quoteAmount: to.toAmount(),
        txId: tx.id,
      }),
    ),
    timeout(applicationConfig.operationTimeoutTime),
  );
