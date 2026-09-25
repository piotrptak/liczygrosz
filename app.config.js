// Extends app.json; the base URL is set per deployment (e.g. "/liczygrosz" for GitHub Pages).
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || '',
  },
});
