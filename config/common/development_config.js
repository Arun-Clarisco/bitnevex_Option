
// Live 
const dbName = 'bitnevex';
const dbUser = "BitnevexAdmin";
const dbPwd = "DL9xPAvawflsiqyiFy";
const dbCluster = "178.105.63.233:27017";

let envname = process.env.NODE_ENV;

module.exports = {
	env: envname,
	dbName: dbName,
	dbconnection: `mongodb://${dbUser}:${dbPwd}@${dbCluster}/${dbName}?retryWrites=true&w=majority`,
	caPath: "",
	port: 4006,
	passPhrase: '.S+X)Zmur=br;y+$2xjBfkJyTm1].v9-',
	algorithm: 'aes-256-ctr',
	iv: 'bLMjTTIuNUpWe345',
	jwtTokenAdmin: '[pQ8v&wpx!Gn[f.2Ug',
	jwtTokenCustomers: '2WHm-S!SMgnj3tA#3y',
	primarySmtp: {
		smtpDetails: {
			keys: {
				host: 'smtp.zeptomail.eu',
				port: 587,
				secure: false,
				requireTLS: true,
				auth: {
					user: 'emailapikey',
					pass: 'yA6KbHtT6Q/wl2JQQUQ80Jbf8Yw5//87gHu/5320e8ZyKNaziaFu1RM9ItCzJWfdiNCDsqkAY90QJIvov4sMLJBhYIdRK5TGTuv4P2uV48xh8ciEYNYvjJ6tArIXEqRMdhIsCSgzTvFt'
				}
			},
			email: 'noreply@nvxo.io'
		},
	},
	serverType: 'http',
	options: {
		// 
	},
	// frontEnd: 'http://localhost:3000/',
	// backEnd: 'http://localhost:3008/api/',
	frontEnd: 'https://www.nvxo.io/',
	backEnd: "https://options-api.nvxo.io/api/",
	galleryLink: "https://options-api.nvxo.io/",
	siteName: 'NVXO',
	url: "nvxo.io",
	Exchange_Frontend: "https://www.nvxo.io",
	Exchange_Admin: "https://7lxqmpsow7obo7evycdsp.nvxo.com",

	timer: {
		resendOtp: 120
	},

	FanTknSymbol: "NVX",

	sectionStatus: {
		optionsGameCron: "Enable"
	},

	REACT_APP_1_ENCRYPTION_KEY: "63rTB5BPxs7hG7cp90ocA1qBfFFp7A",
	REACT_APP_2_ENCRYPTION_KEY: "z9L3fnQHWPv7uhurubpS1PyOLE3cJs",
	REACT_APP_3_ENCRYPTION_KEY: "LFQXlSytfyR4QcWWevg3h8E8nFYpR9",
	REACT_APP_4_ENCRYPTION_KEY: "dNmO47yN6PGMDdcr2Eh9MBr2INgzSo",
	REACT_APP_5_ENCRYPTION_KEY: "t29M9ToRCq6qCZUoyaphHB9atDBlLs",
	REACT_APP_6_ENCRYPTION_KEY: "5RV3SW3Fe4Nj2tlfRwgBJbYAaTdTRl",
	REACT_APP_7_ENCRYPTION_KEY: "ID0ePgE1ysLKTUvvS9ZKl6UX2vYZEe",
	REACT_APP_8_ENCRYPTION_KEY: "3gFbkEQdyveRqCn1axNXw5foyDkAwI",
	REACT_APP_9_ENCRYPTION_KEY: "2Gzqn1SmSxBukKEVQgHlETohQohGd3",
	REACT_APP_10_ENCRYPTION_KEY: "mKc8eUu0eKt3IiTHSYiICadzIwNHTK"

}
