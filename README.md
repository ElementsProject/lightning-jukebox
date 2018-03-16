# Lightning Jukebox

A Lightning powered Jukebox :zap: Pay with Bitcoin to choose your music.

Built with [Lightning Charge](https://github.com/ElementsProject/lightning-charge),
plays music from YouTube.

## HOWTO

1. [Setup Lightning Charge](https://github.com/ElementsProject/lightning-charge/blob/master/README.md#getting-started).

2. Install Lightning Jukebox and start `jukeboxd`:

   ```bash
   $ npm install -g lightning-jukebox

   $ jukeboxd --charge-token mySecretToken --price '0.0001 BTC'
   Jukebox server running on http://localhost:6100
   ```

   You may pick a different theme from [bootswatch](https://bootswatch.com)
   by specifying `--theme [name]` (the default is `darkly`).

3. Navigate to `http://localhost:6100/` on the computer playing the music
   and click `Spawn YouTube player`.
   This will open a new youtube window in a new tab.
   *Make sure keep both* the page on `localhost:6100` and the youtube window open.
   You can use the youtube window to start playing some initial music.

   <img src="https://i.imgur.com/l9PNsdS.png" width="47%"></img>

4. The payment page (`http://localhost:6100/pay`) allows users to pay for music selection.
   You can make this page available over the internet, or set it up on a local device near the
   jukebox (like a tablet).

   <img src="https://i.imgur.com/H9kFDQW.png" width="47%"></img>
   <img src="https://i.imgur.com/pTZkZ0H.png" width="47%"></img>

   Once a payment is made, a push notification will be sent to the player window (via websockets),
   which will open the requested song in the spawned youtube window.

   Payments can also be made directly to the API:

   ```bash
   # with a search string
   $ BOLT11=`curl http://localhost:6100/invoice -d video='are you shpongled full album'`
   $ lightning-cli decodepay $BOLT11
   $ lightning-cli pay $BOLT11

   # with a specific video id
   $ lightning-cli pay `curl http://localhost:6100/invoice \
                        -d video=https://www.youtube.com/watch?v=IDiZG-eAk30`
   ```

## CLI options

```bash
$ jukeboxd --help

  A Lightning powered Jukebox

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
```

## Why a separate YouTube tab instead of embedding the video player?

So that "auto play next" works.

## License

MIT
