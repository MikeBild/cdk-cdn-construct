#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import { CdkCdnConstructStack } from '../lib/cdk-cdn-construct-stack';

const app = new App();

const name = process.env.CDK_CDN_NAME || 'default';
new CdkCdnConstructStack(app, `CDK-CDN-${name}`, {
  namespace: name,
  websiteDistSourcePath: process.env.CDK_CDN_PATH || '',
  domainName: process.env.CDK_CDN_DOMAIN || '',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
