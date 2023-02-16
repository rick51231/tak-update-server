import sqlite3 from 'sqlite3'
import fs from 'fs/promises'
import {Database, open} from 'sqlite'
import {ISqlite} from "sqlite/build/interfaces";

export class DBHelper {
    static db:Database;

    static async init() {
        this.db = await open({
            filename: 'data/db.sqlite',
            driver: sqlite3.Database
        });

        let sql = await  fs.readFile('db.sql');
        await this.db.run(sql.toString('utf8'));
    }

    static async get<T = any>(query:string, params?:any) : Promise<T | undefined> {
        return this.db.get(query, params);
    }

    static async all<T = any[]>(query:string, params?:any) : Promise<T> {
        return this.db.all(query, params);
    }

    static async run(query:string, params?:any) : Promise<ISqlite.RunResult> {
        return this.db.run(query, params);
    }
}
