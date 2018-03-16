#!/usr/bin/env node

const args = require('meow')(`
    Usage
      $ jukeboxd [options]

    Options
      -c, --charge-url <url>      lightning charge server url [default: http://localhost:9112]
      -t, --charge-token <token>  lightning charge access token [required]

      -P, --price <price>         price to play music [default: 0.0001 BTC]
      -m, --theme <name>          pick theme from bootswatch.com [default: darkly]
      -l, --title <name>          website title [default: Lightning Jukebox]

      -p, --port <port>           http server port [default: 9115]
      -i, --host <host>           http server listen address [default: 127.0.0.1]
      -h, --help                  output usage information
      -v, --version               output version number

    Example
      $ jukeboxd -t chargeSecretToken -P '0.0005 EUR'

`, { flags: { chargeUrl: {alias:'c'}, chargeToken: {alias:'t'}
            , price: {alias:'P'}, theme: {alias:'m'}, title: {alias:'l'}
            , port: {alias:'p'}, host: {alias:'i'} } }
).flags

Object.keys(args).filter(k => k.length > 1)
  .forEach(k => process.env[k.replace(/([A-Z])/g, '_$1').toUpperCase()] = args[k])

process.env.CHARGE_TOKEN || (console.error('--charge-token is required'), process.exit(1))
process.env.NODE_ENV || (process.env.NODE_ENV = 'production')

require('babel-polyfill')
require('./app')
