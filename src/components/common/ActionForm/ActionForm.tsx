import { Form, FormGroup } from '@ergolabs/ui-kit';
import React, { FC, ReactNode, useEffect, useState } from 'react';
import { debounceTime, first, Observable } from 'rxjs';

import { useObservable } from '../../../common/hooks/useObservable';
import { Currency } from '../../../common/models/Currency';
import { isOnline$ } from '../../../common/streams/networkConnection';
import { useAssetsBalance } from '../../../gateway/api/assetBalance';
import { queuedOperation$ } from '../../../gateway/api/queuedOperation';
import { ActionButton } from './ActionButton/ActionButton';
import { ActionButtonState, ActionFormContext } from './ActionFormContext';

export interface ActionFormProps<T> {
  readonly form: FormGroup<T>;
  readonly children?: ReactNode | ReactNode[];
  readonly isTokensNotSelected?: (form: T) => boolean;
  readonly isAmountNotEntered?: (form: T) => boolean;
  readonly isLoading?: (form: T) => boolean;
  readonly getMinValueForToken?: (form: T) => undefined | Currency;
  readonly isLiquidityInsufficient?: (form: T) => boolean;
  readonly isSwapLocked?: (form: T) => boolean;
  readonly getInsufficientTokenNameForTx?: (form: T) => undefined | string;
  readonly getInsufficientTokenNameForFee?: (form: T) => undefined | string;
  readonly getInsufficientTokenNameForRefundableDeposit?: (
    form: T,
  ) => undefined | string;
  readonly action?: (form: T) => Promise<any> | Observable<any> | void;
  readonly actionButton?: ReactNode | string;
}

const _ActionForm: FC<ActionFormProps<any>> = ({
  form,
  isLiquidityInsufficient,
  action,
  isAmountNotEntered,
  isTokensNotSelected,
  getInsufficientTokenNameForFee,
  getInsufficientTokenNameForRefundableDeposit,
  isSwapLocked,
  getInsufficientTokenNameForTx,
  getMinValueForToken,
  isLoading,
  children,
}) => {
  const [isOnline] = useObservable(isOnline$);
  const [queuedOperation] = useObservable(queuedOperation$);
  const [, isBalanceLoading] = useAssetsBalance();
  const [value] = useObservable(
    form.valueChangesWithSilent$.pipe(debounceTime(100)),
    [form],
    {},
  );
  const [buttonData, setButtonData] = useState<{
    state: ActionButtonState;
    data?: any;
  }>({
    state: ActionButtonState.CHECK_INTERNET_CONNECTION,
  });

  useEffect(() => {
    if (!isOnline) {
      setButtonData({ state: ActionButtonState.CHECK_INTERNET_CONNECTION });
    } else if (!!queuedOperation) {
      setButtonData({ state: ActionButtonState.PROCESSING_TRANSACTION });
    } else if (isBalanceLoading || (isLoading && isLoading(value))) {
      setButtonData({ state: ActionButtonState.LOADING });
    } else if (isTokensNotSelected && isTokensNotSelected(value)) {
      setButtonData({ state: ActionButtonState.SELECT_TOKEN });
    } else if (isSwapLocked && isSwapLocked(value)) {
      setButtonData({ state: ActionButtonState.SWAP_LOCK });
    } else if (isAmountNotEntered && isAmountNotEntered(value)) {
      setButtonData({ state: ActionButtonState.ENTER_AMOUNT });
    } else if (getMinValueForToken && getMinValueForToken(value)) {
      setButtonData({
        state: ActionButtonState.MIN_VALUE,
        data: {
          currency: getMinValueForToken(value),
        },
      });
    } else if (
      getInsufficientTokenNameForTx &&
      getInsufficientTokenNameForTx(value)
    ) {
      setButtonData({
        state: ActionButtonState.INSUFFICIENT_TOKEN_BALANCE,
        data: {
          token: getInsufficientTokenNameForTx(value),
        },
      });
    } else if (
      getInsufficientTokenNameForFee &&
      getInsufficientTokenNameForFee(value)
    ) {
      setButtonData({
        state: ActionButtonState.INSUFFICIENT_FEE_BALANCE,
        data: {
          nativeToken: getInsufficientTokenNameForFee(value),
        },
      });
    } else if (
      getInsufficientTokenNameForRefundableDeposit &&
      getInsufficientTokenNameForRefundableDeposit(value)
    ) {
      setButtonData({
        state: ActionButtonState.INSUFFICIENT_REFUNDABLE_DEPOSIT_BALANCE,
        data: {
          nativeToken: getInsufficientTokenNameForRefundableDeposit(value),
        },
      });
    } else if (isLiquidityInsufficient && isLiquidityInsufficient(value)) {
      setButtonData({ state: ActionButtonState.INSUFFICIENT_LIQUIDITY });
    } else {
      setButtonData({ state: ActionButtonState.ACTION });
    }
  }, [
    isOnline,
    queuedOperation,
    isBalanceLoading,
    value,
    isLiquidityInsufficient,
    getInsufficientTokenNameForFee,
    getInsufficientTokenNameForTx,
  ]);

  const handleSubmit = () => {
    if (buttonData.state !== ActionButtonState.ACTION || !action) {
      return;
    }

    const result = action(value);

    if (result instanceof Observable) {
      result.pipe(first()).subscribe();
    }
  };

  return (
    <Form form={form} onSubmit={handleSubmit}>
      <ActionFormContext.Provider
        value={{
          state: buttonData.state,
          token: buttonData.data?.token,
          nativeToken: buttonData.data?.nativeToken,
          currency: buttonData.data?.currency,
        }}
      >
        {children}
      </ActionFormContext.Provider>
    </Form>
  );
};

export const ActionForm: typeof _ActionForm & {
  Button: typeof ActionButton;
} = _ActionForm as any;

ActionForm.Button = ActionButton;
