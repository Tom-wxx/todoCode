/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
  appId: 'com.todo.app',
  productName: '待办事项',
  directories: {
    buildResources: 'resources',
    output: 'dist'
  },
  files: ['out/**/*', 'resources/**/*'],
  win: {
    target: ['nsis'],
    icon: 'resources/icon.png'
  }
}

module.exports = config
