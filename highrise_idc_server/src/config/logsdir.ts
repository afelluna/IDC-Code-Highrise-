import config from "./config";
const fs  = require('fs');
import fsExtra from "fs-extra";
		


async function logsDir(){

	let basePath = config.UPLOAD_STORAGE_DIR;

	let paths = [config.LOGS_EVENT_DIR, config.LOGS_FIRST_ALARM_DIR];


	fsExtra.removeSync(basePath+paths[0]);

	fsExtra.removeSync(basePath+paths[1]);

	
	for(var x = 0; x < paths.length; x++){

		let dir = basePath+paths[x];
		
		if (!fs.existsSync(dir)){
	    	fs.mkdirSync(dir);
		}

	}

	
}

export { logsDir }