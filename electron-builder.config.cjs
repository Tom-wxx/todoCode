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
    icon: 'resources/icon.png',
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
