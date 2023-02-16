import {PackagePlatform, PackageType} from "../Enums";

export interface IPackage {
    package_id: number,
    app_id: string,
    name: string
    platform: PackagePlatform
    type: PackageType
    version: string
    version_code: number
    description: string
    apk_hash: string
    apk_size: number
    os_requirements: string
    tak_prereq: string,
    image: Buffer
}