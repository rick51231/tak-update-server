import express from "express";
import fileUpload from 'express-fileupload';
import {PackageManager} from "./PackageManager";
import {PackageModel} from "./DB/PackageModel";

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

        this.app.get('/apk/:file_id.apk', ((req, res) => {
            let appFileId = parseInt(req.params.file_id ?? '', 10);

            if(appFileId===0 || isNaN(appFileId)) {
                res.status(404).end();
                return;
            }

            res.sendFile(PackageManager.STORAGE_DIR+'/'+appFileId+'.apk', { root: '.' }, () => {
                res.status(404).end();
            });
        }));

        this.app.get('/icon/:file_id.png',async (req, res) => {
            let appFileId = parseInt(req.params.file_id ?? '', 10);

            if(appFileId===0 || isNaN(appFileId)) {
                res.status(404).end();
                return;
            }

            let pkg = await PackageModel.getById(appFileId);

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
                txt += '<tr><td><img src="/icon/'+p.package_id+'.png" height="24"></td><td>'+p.name+' ('+p.type+')</td><td>'+p.app_id+'</td><td>'+p.version+' ('+p.version_code.toString(10)+')</td><td>'+p.description+'</td></tr>';
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
            }
            res.redirect('/manage?token='+TOKEN);
        }));
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }
}

