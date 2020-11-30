
const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#0095ff',
              '@font-size-base': '14px',
              '@component-background': '#292f34',
              '@text-color': 'fade(@white, 85%)',
              '@text-color-secondary': 'fade(@white, 45%)',
              '@text-color-inverse': '@black'
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
