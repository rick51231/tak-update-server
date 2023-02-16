# TAK Update Server
This is my own implementation of the TAK update protocol/server.
At the moment it only provides basic functionality like uploading plugins/apps and downloading them from the ATAK app.
Currently, only the ATAK application and plugins are supported.


### Installation
- Install requirements via `npm install`
- Build project via `npx tsc`
- Set the `ACCESS_TOKEN` environment variable with your management token. Bash example: `export ACCESS_TOKEN=16123123123`
- Run app via `node build/index.js`
- Upload plugins via `http://localhost:8019/manage?token=<your access token>`

### Usage
- Open menu `ATAK app > More icon > Plugins > More icon > Edit`
- Enable option `Update Server`
- Enter your server url into `Update Server URL`

Please note that ATAK requires HTTPS for the update server, so you should run it behind a TLS reverse proxy or create your own certificates for this app.
