require('babel-polyfill')

const $ = require('jquery')
    , B = require('bootstrap')
    , qrcode = require('qrcode')
    , payDialog = require('../views/_payment.pug')
    , paidDialog = require('../views/_success.pug')

$(document).on('hidden.bs.modal', '.modal', e => $(e.target).remove())

$(document).on('submit', 'form.pay', async e => {
  e.preventDefault()

  $('[type=submit]').prop('disabled', true)

  try {
    const inv  = await $.post('invoice', { video: $('[name=video]').val() }, null, 'json')
        , qr   = await qrcode.toDataURL(`lightning:${ inv.payreq }`.toUpperCase(), { margin: 2, width: 300 })
        , diag = $(payDialog({ ...inv, qr })).modal()

    updateExp(diag.find('[data-countdown-to]'))

    const unlisten = listen(inv.id, paid => (diag.modal('hide'), paid && success()))
    diag.on('hidden.bs.modal', unlisten)
  }
  finally { $(':disabled').attr('disabled', false) }
})

function listen(invid, cb) {
  let retry = _ => listen(invid, cb)
  const req = $.get(`invoice/${ invid }/wait`)

  req.then(_ => cb(true))
    .catch(err =>
      err.status === 402 ? retry()   // long polling timed out, invoice is still payable
    : err.status === 410 ? cb(false) // invoice expired and can no longer be paid
    : err.statusText === 'abort' ? null // user aborted, do nothing
    : setTimeout(retry, 10000)) // unknown error, re-poll after delay

  return _ => (retry = _ => null, req.abort())
}

function success() {
  const diag = $(paidDialog()).modal()
  setTimeout(_ => diag.modal('hide'), 5000)
}

function updateExp(el) {
  const left = +el.data('countdown-to') - (Date.now()/1000|0)
  if (left > 0) el.text(formatDur(left))
  else el.closest('.modal').modal('hide')
}

function formatDur(x) {
  const h=x/3600|0, m=x%3600/60|0, s=x%60
  return ''+(h>0?h+':':'')+(m<10&&h>0?'0':'')+m+':'+(s<10?'0':'')+s
}

setInterval(_ =>
  $('[data-countdown-to]').each((_, el) => updateExp($(el)))
, 1000)
