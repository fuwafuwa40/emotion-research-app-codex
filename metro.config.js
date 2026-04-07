const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const shouldForceWriteFileSystem =
  process.env.CI !== "true" &&
  process.env.VERCEL !== "1" &&
  process.env.NODE_ENV !== "production";

module.exports = withNativeWind(config, {
  input: "./global.css",
  // NativeWind file-system output helps local native development,
  // but it breaks Expo static web export in CI because Metro cannot hash
  // react-native-css-interop's generated cache file under node_modules.
  forceWriteFileSystem: shouldForceWriteFileSystem,
});
