const path = require("path");

module.exports = {
  entry: "./src/refactor-this/app.js",
  output: {
    filename: "bundle.js",
    path: path.join(__dirname, "src/refactor-this"),
    publicPath: "/",
  },
  module: {
    rules: [
      {
        loader: "babel-loader",
        test: /\.js$/,
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  devServer: {
    static: path.join(__dirname, "src/refactor-this"),
    port: 3000,
    historyApiFallback: true,
  },
};
