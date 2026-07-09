import * as dotenv from "dotenv";
import {machineId, machineIdSync} from 'node-machine-id';

let id = machineIdSync();
console.log(id);

dotenv.config();

interface IDBConfig{
	host: string;
	port: number;
	name: string;
	username: string;
	password: string;
}

interface IConfig{
	DB: any;
	PORT: number;
	HOST: string;
	ENV: string;
	TEMPFILE: string;
	UPLOAD_STORAGE_DIR: string;
	LOGS_EVENT_DIR: string;
	LOGS_FIRST_ALARM_DIR: string;

	MACHINE_ID: string;
	
	GPIO:{
		buzz: number,
		green: number,
		yellow: number,
		red: number,
		buttOne: number,
		buttTwo: number,
	}
}

const env = process.env.NODE_ENV || 'development';

const dev: IDBConfig = {
	host: process.env.DEV_DB_HOST || 'localhost',
	port: parseInt(process.env.DEV_DB_PORT as string) || 27017,
	name: process.env.DEV_DB_DATABASE || 'database',
	username: process.env.DEV_DB_USERNAME || 'root',
	password: process.env.DEV_DB_PASSWORD || ''
 	
};

const test: IDBConfig = {
	host: process.env.TEST_DB_HOST || 'localhost',
	port: parseInt(process.env.TEST_DB_PORT as string) || 27017,
	name: process.env.TEST_DB_DATABASE || 'test_database',
	username: process.env.TEST_DB_USERNAME || 'root',
	password: process.env.TEST_DB_PASSWORD || ''
 	
};

const prod: IDBConfig = {
	host: process.env.PROD_DB_HOST || 'localhost',
	port: parseInt(process.env.PROD_DB_PORT as string) || 27017,
	name: process.env.PROD_DB_DATABASE || 'database',
	username: process.env.PROD_DB_USERNAME || 'root',
	password: process.env.PROD_DB_PASSWORD || ''
};

const config: IConfig = {
	DB: env == 'development' ? dev : env == 'testing' ? test : env == 'production' ? prod : {},
	PORT: parseInt(process.env.APP_PORT as string),
	HOST: process.env.APP_HOST as string,
	ENV: env,
	TEMPFILE: process.env.TEMPFILE as string,
	UPLOAD_STORAGE_DIR: process.env.UPLOAD_STORAGE_DIR as string,

	LOGS_EVENT_DIR: process.env.LOGS_EVENT_DIR as string,
	LOGS_FIRST_ALARM_DIR: process.env.LOGS_FIRST_ALARM_DIR as string,

	MACHINE_ID: id,
	
	GPIO:{
		buzz: parseInt(process.env.BUZZ_GPIO as string),
		green: parseInt(process.env.GREEN_GPIO as string),
		yellow: parseInt(process.env.YELLOW_GPIO as string),
		red: parseInt(process.env.RED_GPIO as string),
		buttOne: parseInt(process.env.BUTT_ONE as string),
		buttTwo: parseInt(process.env.BUTT_TWO as string),
	}


};

export default config;