module.exports = {
  appId: 'sales-trail',
  productName: 'Sales Trail',
  asar: false,
  files: ['php-bin', 'assets', 'index.js', 'php.js', { from: "api", to: "api", filter: ["**/*"] }],
  icon: './assets/icon.png'
}
