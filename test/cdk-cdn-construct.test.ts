import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';
import { CdkCdnConstructStack } from '../lib/cdk-cdn-construct-stack';

test.skip('Empty Stack', () => {
  const app = new App();

  const stack = new CdkCdnConstructStack(app, 'MyTestStack', { namespace: 'test', domainName: 'demo', websiteDistSourcePath: 'demo' });

  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
