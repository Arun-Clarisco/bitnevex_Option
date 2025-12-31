let environ;
if(process.env.NODE_ENV) {
	environ = process.env.NODE_ENV;
} else {
	environ = 'development';
}

let envPath;
if(environ === "development") {
	envPath = "common";
}
else if(environ !== "development") {
	envPath = "main";
}
module.exports = require("./"+envPath+"/"+environ+"_config.js");