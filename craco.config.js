/* eslint-disable */
// * 配置完成后记得重启下
const WebpackBar = require('webpackbar'); // webpack 编译进度条
const CracoLessPlugin = require('craco-less');
const path = require('path');
const pathResolve = pathUrl => path.join(__dirname, pathUrl);

const { whenDev, whenProd } = require('@craco/craco');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
// const DashboardPlugin = require('webpack-dashboard/plugin')
const TerserPlugin = require('terser-webpack-plugin');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');

// 开发环境用到的插件
const whenDevPlugin = whenDev(
  () => [
    // 模块循环依赖检测插件
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      include: /src/,
      failOnError: true,
      allowAsyncCycles: false,
      cwd: process.cwd(),
    }),
    // 用于观察webpack的打包进程
    // new DashboardPlugin(),
    // 热更新
    // new webpack.HotModuleReplacementPlugin(),
  ],
  []
);

// 生产环境需要用到的插件
const whenProdPlugin = whenProd(
  () => [
    new TerserPlugin({
      // sourceMap: true, // Must be set to true if using source-maps in production
      terserOptions: {
        ecma: undefined,
        parse: {},
        compress: {
          warnings: false,
          drop_console: true, // 生产环境下移除控制台所有的内容
          drop_debugger: true, // 移除断点
          pure_funcs: ['console.log'], // 生产环境下移除console
        },
      },
    }),
    // html 文件方式输出编译分析
    new BundleAnalyzerPlugin(),
    // {
    //   analyzerMode: 'static',
    //   openAnalyzer: false,
    //   reportFilename: path.resolve(__dirname, `analyzer/index.html`),
    // }
    // 打压缩包
    new CompressionWebpackPlugin(),
    // {
    //   algorithm: 'gzip',
    //   test: new RegExp('\\.(' + ['js', 'css'].join('|') + ')$'),
    //   threshold: 1024,
    //   minRatio: 0.8,
    // }
  ],
  []
);
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  webpack: {
    alias: {
      '@': pathResolve('src'),
    },
    // 配置cdn外部资源不打包
    // externals: {
    //   react: 'React',
    // },
    plugins: [
      // webpack构建进度条
      new WebpackBar({
        name: 'webpack开始构建......',
        color: '#2d56f8',
        profile: true,
      }),
      // 查看打包的进度
      new SimpleProgressWebpackPlugin(),
      ...(isDev ? whenDevPlugin : whenProdPlugin),
    ],
    //抽离公用模块
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            chunks: 'initial',
            minChunks: 2,
            maxInitialRequests: 5,
            minSize: 0,
          },
          vendor: {
            test: /node_modules/,
            chunks: 'initial',
            name: 'vendor',
            priority: 10,
            enforce: true,
          },
        },
      },
    },
  },
  // babel: {
  //   //用来支持装饰器
  //   plugins: [["@babel/plugin-proposal-decorators", {legacy: true}]],
  // },
  style: {
    postcss: {
      loaderOptions: {
        postcssOptions: {
          ident: 'postcss',
          plugins: [
            [
              'postcss-pxtorem',
              {
                rootValue: 375 / 10, // 根元素字体大小
                // propList: ['width', 'height']
                propList: ['*'],
                exclude: /node_modules/i,
              },
            ],
          ],
        },
      },
    },
  },
  configure: (webpackConfig, { env, paths }) => {
    // 开启持久化缓存
    webpackConfig.cache.type = 'filesystem';
    return webpackConfig;
  },
  // 新增 craco 提供的 plugin
  plugins: [
    // 配置Antd主题less
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
            modifyVars: { '@primary-color': '#1DA57A' },
            //配置全局less 变量，不需要在使用的地方导入了
            // globalVars: {
            //   hack: `true; @import '~@/assets/style/variable.less';`
            // }
          },
        },
        modifyLessRule: function () {
          return {
            test: /\.less$/,
            exclude: /node_modules/,
            use: [
              { loader: 'style-loader' },
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    localIdentName: '[local]_[hash:base64:6]',
                  },
                },
              },
              { loader: 'less-loader' },
            ],
          };
        },
      },
    },
  ],

  devServer: {
    port: 3001,
    // 配置代理解决跨域
    proxy: {
      '/api': {
        // 指定代理服务器
        target: 'http://shop.fenotes.com/',
        // 是否修改源
        changeOrigin: true,
        // 是否需要重写路径
        pathRewrite: { '^/api': '' },
      },
    },
  },
};
