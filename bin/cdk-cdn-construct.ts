#!/usr/bin/env node
import { join } from 'path';
import { App } from '@aws-cdk/core';
import { CdkCdnConstructStack } from '../lib/cdk-cdn-construct-stack';

const app = new App();

new CdkCdnConstructStack(app, 'CDK-CDN-TODO', {
  namespace: 'my-static-app',
  websiteDistSourcePath: join(__dirname, '../../frontend', 'build'),
  domainName: 'mikebild.com',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
