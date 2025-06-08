const { join } = require('path')

let php;

if (process.platform === 'win32') {
  php = join(__dirname, 'php-bin', 'php.exe')
} else {
  php = join(__dirname, 'php-bin', 'php')
}

module.exports = php;
