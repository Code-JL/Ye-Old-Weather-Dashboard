module.exports = {
  multipass: true, // multiple optimizations in a single run
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false, // keep viewBox for proper scaling
          removeTitle: true, // remove title as we use alt text
          cleanupIds: true, // clean IDs for better optimization
          removeUselessStrokeAndFill: true, // remove unnecessary attributes
          inlineStyles: true, // inline styles when possible
          removeHiddenElems: true, // remove hidden elements
          removeEmptyAttrs: true, // remove empty attributes
          removeEmptyContainers: true, // remove empty containers
          mergePaths: true, // merge paths when possible
          convertColors: { // standardize color formats
            currentColor: true // preserve currentColor value
          }
        }
      }
    }
  ]
}; 