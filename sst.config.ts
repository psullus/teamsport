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
    const site = new sst.aws.StaticSite('TeamsportWeb', {
      path: 'apps/web',
      build: {
        command: 'npm run build',
        output: '../../dist/teamsport/browser',
      },
    });

    return {
      url: site.url,
    };
  },
});
