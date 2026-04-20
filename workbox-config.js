module.exports = {
  globDirectory: 'dist/wave-fit/browser',
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,webmanifest,ttf,woff,woff2}'
  ],
  swSrc: 'src/sw.js',
  swDest: 'dist/wave-fit/browser/sw.js',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
};
