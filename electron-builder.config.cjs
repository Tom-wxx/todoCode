/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
  appId: 'com.todo.app',
  productName: 'TodoApp',
  directories: {
    buildResources: 'resources',
    output: 'dist'
  },
  files: ['out/**/*', 'resources/**/*'],
  win: {
    target: ['nsis'],
    // Windows exe/taskbar icon should be .ico (multi-size) for consistent results.
    icon: 'resources/icon.ico',
    signAndEditExecutable: false
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'TodoApp'
  }
}

module.exports = config
