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
  bucketName?: string;
  websiteDistSourcePath: string;
  domainName: string;
}

export class CdkCdnConstructStack extends Stack {
  public readonly bktName: string;
  public readonly contentBucket: Bucket;

  constructor(scope: Construct, id: string, props: CdkCdnConstructProps & StackProps) {
    super(scope, id, props);

    const { namespace, domainName, websiteDistSourcePath, bucketName } = props;

    this.bktName = bucketName || namespace;

    this.contentBucket = new Bucket(this, `${namespace}-Bucket-WebApp`, {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      bucketName: `${this.bktName}.${domainName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const originAccessIdentity = new OriginAccessIdentity(this, `${namespace}-OriginAccessIdentity`);
    this.contentBucket.grantRead(originAccessIdentity);

    const zone = HostedZone.fromLookup(this, `${namespace}-BaseZone`, {
      domainName,
    });

    const certificate = new DnsValidatedCertificate(this, `${namespace}-CloudFrontWebCertificate`, {
      domainName: `${this.bktName}.${domainName}`,
      hostedZone: zone,
      region: 'us-east-1',
    });

    const distribution = new CloudFrontWebDistribution(this, `${namespace}-CloudFrontWebDistribution`, {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.contentBucket,
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
        names: [`${this.bktName}.${domainName}`],
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
      destinationBucket: this.contentBucket,
      distribution,
      distributionPaths: ['/*'],
      retainOnDelete: false,
    });

    new ARecord(this, `${namespace}-AliasRecord`, {
      zone,
      recordName: `${this.bktName}.${domainName}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}
