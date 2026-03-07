/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'teamsport',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    };
  },
  async run() {
    const jwtSecret = new sst.Secret('JwtSecret');

    const vpc = new sst.aws.Vpc('Vpc', { nat: 'ec2' });

    const database = new sst.aws.Postgres('Database', { vpc });

    const bucket = new sst.aws.Bucket('Avatars', {
      access: 'public',
    });

    const email = new sst.aws.Email('Email', {
      sender: 'teamsport.psullus.com',
      dns: sst.aws.dns(),
    });

    const cluster = new sst.aws.Cluster('Cluster', { vpc });

    const api = new sst.aws.Service('Api', {
      cluster,
      link: [database, bucket, email],
      image: {
        context: '.',
        dockerfile: 'apps/api/Dockerfile',
      },
      environment: {
        DATABASE_URL: $interpolate`postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}`,
        JWT_SECRET: jwtSecret.value,
        BUCKET_NAME: bucket.name,
        CORS_ORIGIN: '*',
        EMAIL_SENDER: 'noreply@teamsport.psullus.com',
        APP_URL: router.url,
      },
      loadBalancer: {
        rules: [{ listen: '80/http', forward: '4000/http' }],
        health: {
          '4000/http': {
            path: '/api/hello',
            interval: '30 seconds',
          },
        },
      },
      cpu: '0.25 vCPU',
      memory: '0.5 GB',
      dev: {
        command: 'npm run start:api',
        url: 'http://localhost:4000',
      },
    });

    const router = new sst.aws.Router('Router', {
      domain: {
        name: 'dev.teamsport.psullus.com',
        dns: sst.aws.dns(),
      },
    });
    router.route('/api', api.url);

    const site = new sst.aws.StaticSite('TeamsportWeb', {
      path: 'apps/web',
      build: {
        command: 'npm run build',
        output: '../../dist/teamsport/browser',
      },
      router: {
        instance: router,
        path: '/',
      },
    });

    return {
      url: router.url,
      api: api.url,
    };
  },
});
