const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// inlineRem 16 makes Tailwind's spacing scale the 4pt grid (p-5 = 20pt).
module.exports = withNativeWind(config, {
  input: './src/theme/global.css',
  inlineRem: 16,
});
