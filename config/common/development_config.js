// Development config - every value comes from .env (see .env.example)

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const env = process.env;

const REQUIRED = [
	"DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST",
	"JWT_TOKEN_ADMIN", "JWT_TOKEN_CUSTOMERS",
];
const missing = REQUIRED.filter((key) => !env[key]);
if (missing.length) {
	throw new Error(`Missing required environment variables in .env: ${missing.join(", ")}`);
}

const dbName = env.DB_NAME;
const dbUser = encodeURIComponent(env.DB_USER);
const dbPwd = encodeURIComponent(env.DB_PASSWORD);
const dbOptions = env.DB_OPTIONS ? `?${env.DB_OPTIONS}` : "";

module.exports = {
	dbName: dbName,
	dbconnection: `mongodb://${dbUser}:${dbPwd}@${env.DB_HOST}/${dbName}${dbOptions}`,
	caPath: env.DB_CA_PATH || "",
	port: Number(env.PORT) || 4006,
	jwtTokenAdmin: env.JWT_TOKEN_ADMIN,
	jwtTokenCustomers: env.JWT_TOKEN_CUSTOMERS,
	sectionStatus: {
		optionsGameCron: env.OPTIONS_GAME_CRON === "Disable" ? "Disable" : "Enable"
	}
};
