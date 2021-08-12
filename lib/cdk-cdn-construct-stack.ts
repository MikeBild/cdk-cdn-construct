import { Stack, Construct, StackProps, RemovalPolicy } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { CloudFrontWebDistribution, OriginAccessIdentity, CloudFrontAllowedMethods } from '@aws-cdk/aws-cloudfront';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';
import { HostedZone } from '@aws-cdk/aws-route53';

interface CdkCdnConstructProps {
  namespace: string;
  websiteDistSourcePath: string;
  domainName: string;
}

export class CdkCdnConstructStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkCdnConstructProps & StackProps) {
    super(scope, id, props);

    const { namespace, domainName, websiteDistSourcePath } = props;

    const sourceBucket = new Bucket(this, `${namespace}-Bucket-WebApp`, {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      bucketName: `${namespace}.${domainName}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const originAccessIdentity = new OriginAccessIdentity(this, `${namespace}-OriginAccessIdentity`);
    sourceBucket.grantRead(originAccessIdentity);

    const zone = HostedZone.fromLookup(this, `${namespace}-BaseZone`, {
      domainName,
    });

    const certificate = new DnsValidatedCertificate(this, `${namespace}-CloudFrontWebCertificate`, {
      domainName: `${namespace}.${domainName}`,
      hostedZone: zone,
      region: 'us-east-1',
    });

    const distribution = new CloudFrontWebDistribution(this, `${namespace}-CloudFrontWebDistribution`, {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: sourceBucket,
            originAccessIdentity: originAccessIdentity,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              allowedMethods: CloudFrontAllowedMethods.ALL,
              forwardedValues: {
                queryString: true,
              },
            },
          ],
        },
      ],
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: [`${namespace}.${domainName}`],
      },
      errorConfigurations: [
        {
          errorCode: 404,
          responsePagePath: '/index.html',
          responseCode: 200,
        },
      ],
    });

    new BucketDeployment(this, `${namespace}-BucketDeployment`, {
      sources: [Source.asset(websiteDistSourcePath)],
      destinationBucket: sourceBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new ARecord(this, `${namespace}-AliasRecord`, {
      zone,
      recordName: `${namespace}.${domainName}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}
