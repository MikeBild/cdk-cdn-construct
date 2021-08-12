#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import { CdkCdnConstructStack } from '../lib/cdk-cdn-construct-stack';

const app = new App();

new CdkCdnConstructStack(app, 'CDK-CDN-TODO', {
  namespace: 'my-static-app',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
