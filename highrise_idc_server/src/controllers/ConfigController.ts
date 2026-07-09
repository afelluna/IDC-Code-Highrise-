import { Request, Response, NextFunction } from "express";
import mtz from "moment-timezone";
import Database from "../database/mysqldatabase";
import logger from "../config/logger";
import ResponseHandler from "../middleware/responseHandler";
import config from "../config/config";
import fsExtra from "fs-extra";

//const fsExtra     = require('fs-extra'); //FOR MOVING FILES
import path from "path";

const lineByLine = require("n-readlines");
const fs = require("fs");
const responseHandler = new ResponseHandler();
const date = mtz().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");
const db = new Database();

export class ConfigController {
  public sql: string = "";
  public param: any = [];
  public result: any;
  public newResult: any;

  constructor() {}

  public async getSensorConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.result = await db.query("SELECT * FROM config_tbl LIMIT 1");

      responseHandler.sendResponse(
        res,
        "Successfuly fetch sensor config",
        200,
        false,
        this.result[0]
      );
    } catch (err) {
      logger.info("Error fetch sensor config " + err);
      next(err);
    }
  }

  public async updateSensorName(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { node_name, ctrlip, ctrlport } = req.body;

      let sql =
        "UPDATE config_tbl SET node_name = ?, ctrlip = ? , ctrlport = ?";

      let param = [node_name, ctrlip, ctrlport];

      db.query(sql, param)
        .then((result) => {
          responseHandler.sendResponse(
            res,
            "Successfuly update node_name info",
            200,
            false
          );
        })
        .catch((err) => {
          responseHandler.sendResponse(
            res,
            "Error update node_name info",
            200,
            true
          );
        });
    } catch (err) {
      logger.info("Error fetch intensity config " + err);
      next(err);
    }
  }
}
