import * as Express from "express";

import { Request, Response, NextFunction } from "express";

import { check, body } from "express-validator";
import validate from "../middleware/validate";

import config from "../config/config";
import logger from "../config/logger";

import { ConfigController } from "../controllers/ConfigController";

import MulterUpload from "../config/multerupload";

const router = Express.Router();
const autoReap = require("multer-autoreap");

let configCtrl = new ConfigController();

router.get(
  "/getSensorConfig",
  [],
  (req: Request, res: Response, next: NextFunction) => {
    validate(req, res, next);
  },
  configCtrl.getSensorConfig.bind(configCtrl)
);

router.post(
  "/updateSensorName",
  [
    check("node_name", "node name is required").not().isEmpty(),
    check("ctrlip", "ctrlip is required").not().isEmpty(),
    check("ctrlport", "ctrlport name is required").not().isEmpty(),
  ],
  (req: Request, res: Response, next: NextFunction) => {
    validate(req, res, next);
  },
  configCtrl.updateSensorName.bind(configCtrl)
);
export default router;
