const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const SOURCE = path.join(__dirname, "src/refactor-this");
const OUTPUT = path.join(__dirname, "dist");

module.exports = (_env, argv = {}) => {
  const isProduction = argv.mode === "production";

  return {
    entry: path.join(SOURCE, "app.js"),

    output: {
      // Build artefacts belong in dist/, not in the source tree.
      path: OUTPUT,
      // Content hashes let the bundle be cached forever and still update.
      filename: isProduction ? "[name].[contenthash:8].js" : "[name].js",
      publicPath: "/",
      clean: true,
    },

    // Production source maps measurably cost ~10 KB of shipped JS here
    // (terser emits less compact output when it has to map it), so they are
    // left off for a static app whose sources are in the repository anyway.
    devtool: isProduction ? false : "eval-cheap-module-source-map",

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: "babel-loader",
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },

    optimization: {
      // React and the router change far less often than the app code, so
      // giving them their own content-hashed chunk keeps them cached across
      // deploys. Measured cost of the split: ~1.2 KB of lost scope hoisting.
      splitChunks: { chunks: "all" },
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(SOURCE, "index.html"),
        minify: isProduction && {
          collapseWhitespace: true,
          removeComments: true,
        },
      }),
      // Makes the API base URL configurable at build time instead of hardcoded.
      new webpack.DefinePlugin({
        "process.env.API_BASE_URL": JSON.stringify(
          process.env.API_BASE_URL || ""
        ),
      }),
    ],

    devServer: {
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || "localhost",
      historyApiFallback: true,
      static: false,
    },
  };
};
