// Live 

// const dbName = 'nexchange';
// const dbUser = "Bitnevex";
// const dbPwd = "lVakKs2k4C4FiaLJ";
// const dbCluster = "cluster0.ibjcp.mongodb.net";

// Local 
const dbName = 'CryptoExchange';
const dbUser = "sabarirajan_db_user";
const dbPwd = "aKnssXasVbnDqPOc";
const dbCluster = "bitnevex-local.ov3hqfy.mongodb.net";

let envname = process.env.NODE_ENV;

module.exports = {
	env: envname,
	dbName: dbName,
	dbconnection: `mongodb+srv://${dbUser}:${dbPwd}@${dbCluster}/${dbName}?retryWrites=true&w=majority`,
	caPath: "",
	port: 3006,
	passPhrase: 'T1Bt0Lx5jPu5L6AJ8523IAv0anRd03Ya',
	algorithm: 'aes-256-ctr',
	iv: 'bLMjTTIuNUpWe345',
	jwtTokenAdmin: 'ExAdMin',
	jwtTokenCustomers: 'tTPeRBYEshnND5Sd4DEXa0BO9',
	smtpDetails: {
		keys: {
			host: 'mail.privateemail.com',
			port: 465,
			secure: true,
			auth: {
				user: 'noreply@bitnevex.com',
				pass: 'Clarisco@2024'
			}
		},
		email: 'noreply@bitnevex.com'
	},
	serverType: 'http',
	options: {
		// 
	},
	adminEnd: 'https://staging.adminpanel.bitnevex.com/',
	frontEnd: 'https://staging.bitnevex.com/',
	backEnd: "https://staging.options-api.bitnevex.com/api/",
	galleryLink: "https://staging.options-api.bitnevex.com/",
	siteName: 'BitNevex',
	url: "localhost",

	timer: {
		resendOtp: 120
	},

	FanTknSymbol: "NVX",

	sectionStatus: {
		spotTrade: "Enable",
		perpetualTrade: "Enable",
		p2p: "Enable",
		captcha: "Enable",
		cryptoLoan: "Enable",
		spotTradeCron: "Enable",
		derivativeCron: "Disable",
		pushNotification: "Disable",
		activityNotification: "Disable",
		optionsGameCron: "Enable"
	},

	REACT_APP_1_ENCRYPTION_KEY: "I6RXRiED7kNv3JQzph78Tg0oEbbfyA",
	REACT_APP_2_ENCRYPTION_KEY: "FkXmMDz9Jf4aFDvzF6x2iEgPnyKKKn",
	REACT_APP_3_ENCRYPTION_KEY: "Bu6B1nL7dwZntvl7cvwMZ32gER1343",
	REACT_APP_4_ENCRYPTION_KEY: "Ine6BeyN7UyLUN5zEV10DbfQmZjetI",
	REACT_APP_5_ENCRYPTION_KEY: "rYu42NPXfPS9gKEfWE4Mp5Xb5tstAG",
	REACT_APP_6_ENCRYPTION_KEY: "sQewBADgiw8L6tb08xEXwNTOlGSveC",
	REACT_APP_7_ENCRYPTION_KEY: "ShLq094FWcRA06CINbyMd1hTwQ129r",
	REACT_APP_8_ENCRYPTION_KEY: "fHjThSIRCnpeq5EF1141o0NTki987J",
	REACT_APP_9_ENCRYPTION_KEY: "5OjfuTasl3NZhlKZlXH6B0WrS5j9KH",
	REACT_APP_10_ENCRYPTION_KEY: "aDPKsKln5HY0qMJJtPnvPoa39lcrc3"

}
