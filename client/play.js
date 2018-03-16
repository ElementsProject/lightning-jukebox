import RWebSocket from 'reconnecting-websocket'

new RWebSocket(`ws://${location.host}/ws`).addEventListener('message', msg => {
  const [ type, video ] = msg.data.split(':', 2)
  console.log(`playing by ${type}: ${video}`)

  window.open(type == 'id'
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(video)}`
    : `https://www.google.com/search?q=site%3Ayoutube.com%2Fwatch+${encodeURIComponent(video)}&btnI=Im+Feeling+Lucky&gl=us&hl=en`
  , '_player')
})
