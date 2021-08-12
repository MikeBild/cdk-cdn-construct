import { Stack, Construct, StackProps } from '@aws-cdk/core';

interface CdkCdnConstructProps {
  namespace: string;
}

export class CdkCdnConstructStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkCdnConstructProps & StackProps) {
    super(scope, id, props);

    const { namespace } = props;
  }
}
