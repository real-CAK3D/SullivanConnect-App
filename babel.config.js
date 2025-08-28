
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
          alias: {
            '@': './',
            '@components': './components',
            '@style': './style',
            '@hooks': './hooks',
            '@types': './types',
          },
        },
      ],
      // IMPORTANT: Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
