var webpack = require('webpack')

module.exports = {
  entry: './src/flux.js',
  output: {
    filename: 'dist/flux.js'
  },

  plugins: [
    new webpack.ResolverPlugin([
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
    ], ["normal", "loader"])
  ],

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  }
}
