import "reflect-metadata";	
import express, {Application} from "express";
import logger from "morgan";
import * as bodyParser from "body-parser";
import config from "./config/config";
import routes from "./routes/api";
import * as socketio from "socket.io";

var EventEmitter = require('events');
var cors = require('cors');

var fileUpload = require("express-fileupload");


class App {

	public app: Application;

	constructor() {

		this.app = express();
		this.config();
	}

	private config() {
		if (config.ENV == "development") {
			//this.app.use(logger('dev'));
		}

		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(express.json());
		this.app.use(cors());
		this.app.use(fileUpload());

		let server = require("http").Server(this.app);
		let io 	   = require("socket.io")(server);

		var ee = new EventEmitter();

		this.app.set("server", server);
		this.app.set("socketio", io);
		this.app.set("eventemitter", ee);

		this.app.use(routes);
		
		this.app.use((req, res, next) => {
			
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
			res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');

			if('OPTIONS' === req.method) {
				res.sendStatus(200);
			} else {
				console.log(`${req.ip} ${req.method} ${req.url}`);
				next();
			}
		});

	}

}

export default new App().app;