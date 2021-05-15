const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'development',
    entry: './src/js/index.js',
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: 'dist.bundle.js',
    },
    plugins: [
        new CopyPlugin({
          patterns: [
            { from: "src/index.html" },
            { from: "src/favicon.ico" },
            { from: "src/img", to: "img" },
            { from: "src/audio", to: "audio" },
          ],
        }),
    ],
    devServer: {
        contentBase: './docs',
    },
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            }
        ]
    }
};