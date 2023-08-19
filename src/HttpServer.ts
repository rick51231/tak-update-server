import express from "express";
import fileUpload from 'express-fileupload';
import {PackageManager} from "./PackageManager";
import {PackageModel} from "./DB/PackageModel";
import {IPackage} from "./DB/Interfaces";
import fs from "fs/promises";

const TOKEN = process.env.ACCESS_TOKEN ?? '';

export class HttpServer {
    private static _instance: HttpServer;
    app = express();

    constructor() {
        this.app.use(fileUpload({
            useTempFiles: true,
        }));
    }

    start() {
        this.addRoutes();
        this.app.listen(8019);
    }

    addRoutes() {
        this.app.all('*', (req, res, next) => {
           console.log('[HTTPServer] '+(req.headers['x-real-ip'] ?? req.ip)+' '+req.method+' '+req.url);
           next();
        });

        this.app.use('/product.infz', express.static(PackageManager.UPDATE_FILE));

        this.app.get('/apk/:appId/latest', async (req, res) => {
            let appId = req.params.appId ?? '';

            if(typeof appId !== 'string' || appId==='') {
                res.status(404).end();
                return;
            }

            let pkg = await PackageModel.getByAppId(appId);

            if(pkg===null) {
                res.status(404).end();
                return;
            }

            res.redirect('/apk/'+pkg.app_id+'-'+pkg.version_code.toString(10)+'.apk');
        });

        this.app.get('/apk/:appId-:version.apk', async (req, res) => {
            let appId = req.params.appId ?? '';

            if(typeof appId !== 'string' || appId==='') {
                res.status(404).end();
                return;
            }

            let pkg = await PackageModel.getByAppId(appId);

            if(pkg===null) {
                res.status(404).end();
                return;
            }

            res.sendFile(PackageManager.STORAGE_DIR+'/'+pkg.package_id+'.apk', { root: '.' }, () => {
                res.status(404).end();
            });
        });

        this.app.get('/icon/:appId.png',async (req, res) => {
            let appId = req.params.appId ?? '';

            if(typeof appId !== 'string' || appId==='') {
                res.status(404).end();
                return;
            }

            let pkg = await PackageModel.getByAppId(appId);

            if(pkg===null) {
                res.status(404).end();
                return;
            }

            res.contentType('image/png');
            res.send(pkg.image);
        });

        this.app.get('/manage', (async (req, res) => {
            if(req.query.token!==TOKEN) {
                res.status(404).end();
                return;
            }
            let txt = '';

            txt += '<table border=1><tr><th></th><th>Name</th><th>AppID</th><th>Version</th><th>Description</th></tr>';
            let packages = await PackageModel.getAll();

            for(let p of packages) {
                txt += '<tr><td><img src="/icon/'+p.app_id+'.png" height="24"></td><td>'+p.name+' ('+p.type+')</td><td><a href="'+HttpServer.getAPKUrl(p)+'">'+p.app_id+'</a></td><td>'+p.version+' ('+p.version_code.toString(10)+')</td><td>'+p.description+'</td></tr>';
            }

            txt += '</table>';
            txt += '<br>';
            txt += '<br>';


            txt += '<form method="POST" action="/upload?token='+TOKEN+'" enctype="multipart/form-data"><input type="file" name="plugin"><input type="submit" value="Upload"></form>';

            res.send(txt);
        }));

        this.app.post('/upload', (async (req, res) => {
            if(req.query.token!==TOKEN) {
                res.status(404).end();
                return;
            }

            if(req.files!==undefined && req.files!==null && req.files.plugin!==undefined && !Array.isArray(req.files.plugin)) {
                await PackageManager.Instance.importFile(req.files.plugin.tempFilePath);
                await fs.unlink(req.files.plugin.tempFilePath);
            }
            res.redirect('/manage?token='+TOKEN);
        }));
    }

    public static getAPKUrl(pkg:IPackage) : string {
        return '/apk/'+pkg.app_id+'-'+pkg.version_code.toString(10)+'.apk';
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }
}

