import { execFile } from "child_process";
import { spawnSync } from "child_process";
import config from "../config/config";

export default class RpiModule {
  private buzzPin = String(config.GPIO.buzz);
  private chip = process.env.GPIO_CHIP || "gpiochip0";
  private activeLow = process.env.BUZZ_ACTIVE_LOW === "true";

  private setBuzz(on: boolean) {
    const level = this.activeLow
      ? on ? "dh" : "dl"
      : on ? "dl" : "dh";

    console.log("SETTING BUZZER:",this.buzzPin, level);
    
    execFile("pinctrl",["set", this.buzzPin, "op", level], (err: Error | null, stdout: string, stderr: string)  => {
	if (err) {
		console.log("pinctrl error:", err.message);}
	if (stderr) {
		console.log("pintctrl stderr:",stderr);
	}
	});
  }

  constructor() {
    console.log("Initializing buzzer GPIO:", this.chip, this.buzzPin);
  }

  setGpioLedVal(gpio: string) {
    console.log("BUZZER EVENT:", gpio);
    const shouldBuzz = 
	 gpio == "yellow" ||  gpio == "yellowred";
   // if (shouldBuzz == true){
    this.setBuzz(shouldBuzz)
   //;}
    //else {
	//console.log("Buzzer off");
	//execFile("pinctrl",["set",this.buzzPin,"op","dh"]);
 // }
}

  closeGPIO() {
	console.log("Buzzer off");
    this.setBuzz(false);
  }
}
