module.exports = {
  // This function will run for each entry/format/env combination
  rollup(config, options) {
    // Mark 'lodash-es' as external
    if (!config.external) {
      config.external = [];
    } else if (typeof config.external === 'string') {
      config.external = [config.external];
    }

    if (Array.isArray(config.external)) {
      config.external.push('lodash-es');
    }

    return config; // always return a config.
  },
};
