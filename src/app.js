import fs   from 'fs'
import path from 'path'
import only from 'only'
import WebSocket from 'ws'

const app    = require('express')()
    , charge = require('lightning-charge-client')(process.env.CHARGE_URL, process.env.CHARGE_TOKEN)

const pwrap   = fn => (req, res, next) => fn(req, res).catch(next)
    , ytRegex = /^https:\/\/[a-z]+\.youtube.com\/watch\?(?:.*&)?v=([\w-]+)/
    , cssPath = require.resolve(`bootswatch/dist/${process.env.THEME || 'darkly'}/bootstrap.min.css`)
    , ctype   = 'application/vnd.lightning.bolt11'

const [ amount, currency='BTC' ] = (process.env.PRICE || '0.0001').split(' ', 2)

// Settings

app.set('port', process.env.PORT || 6100)
app.set('host', process.env.HOST || 'localhost')
app.set('title', process.env.TITLE || 'Lightning Jukebox')
app.set('trust proxy', process.env.PROXIED || 'loopback')
app.set('views', path.join(__dirname, '..', 'views'))
app.set('view engine', 'pug')

// Middleware

app.use(require('morgan')('dev'))
app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: false }))

// Frontend

app.get('/',     (req, res) => res.redirect('play'))
app.get('/play', (req, res) => res.render('play'))
app.get('/pay',  (req, res) => res.render('pay', { currency, amount }))

if (fs.existsSync(path.join(__dirname, 'bundles'))) {
  app.use(require('express').static(path.join(__dirname, 'bundles')))
} else {
  app.get('/play.js', require('browserify-middleware')(require.resolve('../client/play.js')))
  app.get('/pay.js',  require('browserify-middleware')(require.resolve('../client/pay.js')))
}

app.get('/bootstrap.min.css', (req, res) => res.sendFile(cssPath))

// API

app.post('/invoice', pwrap(async (req, res, next) => {
  if (!req.body.video) return res.sendStatus(400)

  const match = req.body.video.toString().match(ytRegex)
      , type  = match ? 'id' : 'search'
      , video = match ? match[1] : req.body.video

  const inv = await charge.invoice({
    currency, amount
  , description: `Pay to play ${ video }`
  , metadata: { source: 'jukebox', type, video }
  , expiry: 600
  })

  res.status(201).format({
    [ctype]() { res.type(ctype).send(inv.payreq) }
  , json()    { res.send(only(inv, 'id payreq msatoshi quoted_currency quoted_amount expires_at')) }
  , default() { res.type(ctype).send(inv.payreq) }
  })
}))

app.get('/invoice/:invoice/wait', pwrap(async (req, res) => {
  const paid = await charge.wait(req.params.invoice, 100)
  res.sendStatus(paid === null ? 402 : paid ? 204 : 410)
  // 402 Payment Require: invoice unpaid but still payable
  // 204 No Content: invoice paid
  // 410 Gone: invoice expired without payment
}))

const server = app.listen(app.settings.port, app.settings.host, _ =>
  console.log(`Jukebox server running on http://${ app.settings.host }:${ app.settings.port }`))

// WebSocket

const wss = new WebSocket.Server({ server, path: '/ws' })

charge.stream().on('payment', inv => {
  if (inv.metadata.source === 'jukebox') {
    console.log(`Incoming jukebox payment, announce ${inv.metadata.type}: ${inv.metadata.video}`)

    wss.clients.forEach(client =>
      (client.readyState === WebSocket.OPEN) && client.send(`${inv.metadata.type}:${inv.metadata.video}`))
  }
})
