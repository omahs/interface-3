import { Flex, Typography } from '@ergolabs/ui-kit';
import React, { ReactNode } from 'react';

import { Currency } from '../../../../common/models/Currency';
import { AssetIcon } from '../../../AssetIcon/AssetIcon';
import { ConvenientAssetView } from '../../../ConvenientAssetView/ConvenientAssetView';
import { PageSection } from '../../../Page/PageSection/PageSection';
import { Truncate } from '../../../Truncate/Truncate';

interface PairSpaceProps {
  readonly title: string;
  readonly xAmount: Currency;
  readonly yAmount: Currency;
  readonly fees?: boolean;
  readonly children?: ReactNode | ReactNode[];
  readonly glass?: boolean;
}

const TOKEN_NAME_SYMBOLS_LIMIT = 15;

const FormPairSection: React.FC<PairSpaceProps> = ({
  title,
  xAmount,
  yAmount,
  fees,
  children,
  glass,
}): JSX.Element => {
  return (
    <PageSection title={title} glass={glass}>
      <Flex direction="col">
        <Flex.Item marginBottom={2}>
          <Flex justify="space-between" align="center">
            <Flex.Item>
              <Flex align="center">
                <Flex.Item marginRight={2}>
                  <AssetIcon asset={xAmount.asset} />
                </Flex.Item>
                <Flex.Item>
                  <Typography.Body strong size="large">
                    <Truncate limit={TOKEN_NAME_SYMBOLS_LIMIT}>
                      {xAmount.asset.ticker}
                    </Truncate>
                  </Typography.Body>
                </Flex.Item>
              </Flex>
            </Flex.Item>
            <Flex.Item>
              <Flex>
                <Typography.Body strong align="right" size="large">
                  {fees ? undefined : xAmount.toString()} (
                  <ConvenientAssetView value={xAmount} prefix="~" />)
                </Typography.Body>
              </Flex>
            </Flex.Item>
          </Flex>
        </Flex.Item>
        <Flex.Item marginBottom={children ? 2 : 0}>
          <Flex justify="space-between">
            <Flex.Item>
              <Flex>
                <Flex.Item marginRight={2}>
                  <AssetIcon asset={yAmount.asset} />
                </Flex.Item>
                <Flex.Item>
                  <Typography.Body strong size="large">
                    <Truncate limit={TOKEN_NAME_SYMBOLS_LIMIT}>
                      {yAmount.asset.ticker}
                    </Truncate>
                  </Typography.Body>
                </Flex.Item>
              </Flex>
            </Flex.Item>
            <Flex.Item>
              <Flex>
                <Typography.Body strong align="right" size="large">
                  {fees ? undefined : yAmount.toString()} (
                  <ConvenientAssetView value={yAmount} prefix="~" />)
                </Typography.Body>
              </Flex>
            </Flex.Item>
          </Flex>
        </Flex.Item>
        {children}
      </Flex>
    </PageSection>
  );
};

export { FormPairSection };
