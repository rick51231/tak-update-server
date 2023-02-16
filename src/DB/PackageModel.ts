import {IPackage} from "./Interfaces";
import {DBHelper} from "./DBHelper";
import {PackagePlatform, PackageType} from "../Enums";

export class PackageModel {
    static async getAll() : Promise<IPackage[]> {
        return await DBHelper.all<IPackage[]>("SELECT * FROM packages");
    }
    static async getById(packageId:number) : Promise<IPackage|null> {
        return (await DBHelper.get<IPackage>("SELECT * FROM packages WHERE package_id = ?", [packageId])) ?? null;
    }
    static async getByAppId(appId:string) : Promise<IPackage|null> {
        return (await DBHelper.get<IPackage>("SELECT * FROM packages WHERE app_id = ?", [appId])) ?? null;
    }
    static async add(appId:string) : Promise<number> {
        let platform = PackagePlatform.Android;
        let result = await DBHelper.run("INSERT INTO packages (app_id, platform) VALUES (?, ?)",[appId, platform]);

        return result.lastID ?? 0;
    }

    static async update(packageId:number, name: string, type:PackageType, version:string, versionCode:number, apkHash:string, apkSize:number, osRequirements:string, description:string, image:Buffer) {
        await DBHelper.run("UPDATE packages SET name = ?, type = ?, version = ?, version_code = ?, apk_hash = ?, apk_size = ?, os_requirements = ?, description = ?, image = ? WHERE package_id = ?",
        [name, type, version, versionCode, apkHash, apkSize, osRequirements, description, image, packageId]);
    }
}