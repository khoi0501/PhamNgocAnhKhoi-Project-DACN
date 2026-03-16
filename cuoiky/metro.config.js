const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Thêm cấu hình để tránh việc Metro cố gắng xử lý các module node: trên Windows
config.resolver.extraNodeModules = {
  'node:sea': '/dev/null',
  'node:process': '/dev/null',
};

module.exports = config;
