// Builds the release APK; works from any shell on Windows, macOS and Linux.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const androidDir = path.join(__dirname, '..', 'android');
// Absolute path: Windows does not search the current directory for executables.
const gradle = path.join(
  androidDir,
  process.platform === 'win32' ? 'gradlew.bat' : 'gradlew',
);
const result = spawnSync(`"${gradle}" assembleRelease`, {
  cwd: androidDir,
  stdio: 'inherit',
  shell: true,
});
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('\nAPK: android/app/build/outputs/apk/release/app-release.apk');
