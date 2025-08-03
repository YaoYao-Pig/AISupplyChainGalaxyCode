var devConfig = require('./webpack.local.config');

ensureBuildExists();

// Start webpack:
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var compiler = webpack(devConfig);

new WebpackDevServer(compiler, {
  publicPath: devConfig.output.publicPath,
  contentBase: "./build",
  disableHostCheck: true,
  hot: true,
  quiet: false,
  filename: 'app.js',
  stats: { colors: true },
  noInfo: false,
  historyApiFallback: true
}).listen(devConfig.port, '0.0.0.0', function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Dev Server listening at http://127.0.0.1:' + devConfig.port);
  }
});

function ensureBuildExists() {
  var fs = require('fs');
  var path = require('path');
  var buildDir = path.join(__dirname, 'build');

  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }

  // --- 核心修改：定义一个可复用的文件复制函数 ---
  function copyFile(source, dest) {
    console.log('Copying ' + source + ' to ' + dest);
    fs.createReadStream(source).pipe(fs.createWriteStream(dest));
  }

  // 复制 index.html
  copyFile(path.join(__dirname, 'src', 'index.html'), path.join(buildDir, 'index.html'));

  // --- 新增：复制我们下载的 sigma 库文件 ---
  var vendorSrcDir = path.join(__dirname, 'src', 'vendor');
  copyFile(path.join(vendorSrcDir, 'sigma.min.js'), path.join(buildDir, 'sigma.min.js'));
  copyFile(path.join(vendorSrcDir, 'sigma.layout.forceAtlas2.min.js'), path.join(buildDir, 'sigma.layout.forceAtlas2.min.js'));
}