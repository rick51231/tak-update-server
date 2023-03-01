import {ApkInfo} from "./Interfaces";
import fs from 'fs/promises';
import crypto from 'crypto';
import {Apk} from "node-apk";
import {PackageModel} from "./DB/PackageModel";
import {PackageType} from "./Enums";
import JSZip from 'jszip';

export class PackageManager {
    static STORAGE_DIR = 'data/apk';
    static UPDATE_FILE = 'data/product.infz';
    private static _instance: PackageManager;

    async start() {
        try {
            await fs.mkdir(PackageManager.STORAGE_DIR);
        } catch {}

        await this.generateUpdateFile();
    }

    async importFile(file:string) : Promise<boolean> {
        const pkg = await PackageManager.readApk(file)

        if(pkg===null)
            return false;

        let origFile = await PackageModel.getByAppId(pkg.appId);
        let fileId;

        if(origFile!==null) {
            if(origFile.version_code >= pkg.version) {
                console.log('[PackageManager] Trying to upload old version of '+pkg.appId);
                return false;
            }

            fileId = origFile.package_id;

            try {
                await fs.unlink(this.getFilePath(fileId));
            } catch {}

            console.log('[PackageManager] Upgrading '+pkg.appId);
        } else {
            fileId = await PackageModel.add(pkg.appId);
        }
        let type = (pkg.appId.startsWith('com.atakmap.android') && pkg.appId.endsWith('.plugin')) ? PackageType.plugin : PackageType.app;
        let fileBuffer = await fs.readFile(file);
        let hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        await PackageModel.update(fileId, pkg.name, type, pkg.versionName, pkg.version, hash, fileBuffer.length, pkg.minSDK.toString(10), pkg.description, pkg.icon);

        try {
            await fs.copyFile(file, this.getFilePath(fileId));
        } catch (e:any) {
            console.log('[PackageManager] Import error: '+e.toString());
        }

        await this.generateUpdateFile();

        return true;
    }

    async generateUpdateFile() {
        let packages = await PackageModel.getAll();

        let productTxtList = '';

        for(let p of packages) {
            productTxtList += [
                p.platform,
                p.type,
                p.app_id,
                p.name,
                p.version,
                p.version_code.toString(10),
                '/apk/'+p.app_id+'-'+p.version_code.toString(10)+'.apk',
                'icon_'+p.package_id+'.png',
                p.description,
                p.apk_hash,
                p.os_requirements,
                p.tak_prereq,
                p.apk_size
            ].join(',');
            productTxtList += '\n';
        }


        let zip = new JSZip();

        zip.file('product.inf', productTxtList);

        for(let p of packages)
            zip.file('icon_'+p.package_id.toString(10)+'.png', p.image);

        let fileData = await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'});

        try {
            await fs.unlink(PackageManager.UPDATE_FILE);
        } catch {}

        await fs.writeFile(PackageManager.UPDATE_FILE, fileData);
    }

    getFilePath(fileId:number) {
        return PackageManager.STORAGE_DIR+'/'+fileId+'.apk';
    }

    private static async readApk(file:string) : Promise<ApkInfo|null> {
        const apk = new Apk(file);

        try {
            const manifest = await apk.getManifestInfo();
            const resources = await apk.getResources();
            // console.log(JSON.stringify(manifest.raw));
            // console.log(JSON.stringify(resources));
            const name = typeof manifest.applicationLabel === 'string' ? manifest.applicationLabel : resources.resolve(manifest.applicationLabel as number)[0].value;
            const minSDK = manifest.raw.children['uses-sdk'][0].attributes.minSdkVersion; //TODO: validate ?
            const icon = manifest.raw.children.application[0].attributes.icon;
            const iconData = await apk.extract(resources.resolve(icon)[0].value);

            let desc = '';
            if(manifest.raw.children.application[0].children['meta-data']!==undefined) {
                for (let i of manifest.raw.children.application[0].children['meta-data']) {
                    if (i.attributes.name !== 'app_desc')
                        continue;

                    desc = resources.resolve(i.attributes.value)[0].value;
                    break;
                }
            }

            if(desc==='' && manifest.raw.children.application[0].attributes.description!==undefined)
                desc = resources.resolve(manifest.raw.children.application[0].attributes.description)[0].value;


            return {
                appId: manifest.package,
                name: name,
                version: manifest.versionCode,
                versionName: manifest.versionName,
                minSDK: minSDK,
                description: desc,
                icon:iconData
            };
        } catch (e:any) {
            console.log('[PackageManager] APK '+file+' read error: '+e.toString());
            return null;
        } finally {
            apk.close();
        }
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }
}