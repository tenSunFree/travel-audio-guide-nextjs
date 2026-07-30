const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (_, argv) => {
  const production = argv.mode === "production";
  return {
    entry: path.resolve(__dirname, "src/index.tsx"),
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "assets/[name].[contenthash:8].js",
      chunkFilename: "assets/[name].[contenthash:8].chunk.js",
      clean: true,
      publicPath: "/",
    },
    devtool: production ? "source-map" : "eval-cheap-module-source-map",
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: { "@": path.resolve(__dirname, "src") },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: "ts-loader",
            options: { transpileOnly: true },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.s?css$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
      }),
    ],
    optimization: { splitChunks: { chunks: "all" }, runtimeChunk: "single" },
    devServer: {
      port: 30401,
      historyApiFallback: true,
      hot: true,
      open: false,
      client: { overlay: true },
    },
  };
};
