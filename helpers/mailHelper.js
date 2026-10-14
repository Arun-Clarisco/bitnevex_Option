const config = require("../config/config");
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const smtpdetails = config.smtpDetails.keys;
const transporter = nodemailer.createTransport(smtpdetails);
const query_helper = require('../helpers/query.helper');
const siteSettings = mongoose.model("SiteSettings");
const { SendMailClient } = require("zeptomail");
const url = "api.zeptomail.eu/v1.1/email";
const token = "Zoho-enczapikey yA6KbHtT6Q/wl2JQQUQ80Jbf8Yw5//87gHu/5320e8ZyKNaziaFu1RM9ItCzJWfdiNCDsqkAY90QJIvov4sMLJBhYIdRK5TGTuv4P2uV48xh8ciEYNYvjJ6tArIXEqRMdhIsCSgzTvFt";
let client = new SendMailClient({ url, token });
exports.sendMail = async (values, callback) => {
	try {
		// return callback(true)
		return await mailService(values, primaryConfig, callback);
	} catch (error) {
		console.log({ mailservice: error.error.details });
	};
};

// const SG_API_KEY = config.SG_API_KEY;
// sgMail.setApiKey(SG_API_KEY);

async function mailService(values, smtpConfig, callback) {
	let admin = await query_helper.findoneData(siteSettings, {}, {});
	const nDate = new Date().toLocaleString('en-US', {
		timeZone: 'Asia/Calcutta'
	});
	let d1 = new Date(nDate);
	let dateInc = d1.getDate();
	let monthInc = d1.getMonth() + 1;
	let yearInc = d1.getFullYear();
	if (dateInc < 10) {
		dateInc = "0" + dateInc;
	}
	if (monthInc < 10) {
		monthInc = "0" + monthInc;
	}
	const setDate = dateInc + "." + monthInc + "." + yearInc;
	const setTime = ((d1.getHours() < 10) ? "0" : "") + d1.getHours() + ":" + ((d1.getMinutes() < 10) ? "0" : "") + d1.getMinutes() + ":" + ((d1.getSeconds() < 10) ? "0" : "") + d1.getSeconds();
	const configAdmin = admin.msg;
	const termsUrl = `${config.frontEnd}terms`;
	const privacyPolicyUrl = `${config.frontEnd}privacy-policy`;

	values.html = values.html
		.replace(/###LOGO###/g, configAdmin.siteLogo)
		.replace(/###SITENAME###/g, configAdmin.siteName)
		.replace(/###SUPPORT###/g, configAdmin.supportEmail)
		.replace(/###COPYRIGHT###/g, configAdmin.copyRights)
		.replace(/###DATE###/g, setDate)

	values.html = mailHTMLNew
		.replace(/###LOGO###/g, configAdmin.siteLogo)
		.replace(/###MAINCONTENT###/g, values.html)
		.replace(/###SITELINK###/g, config.frontEnd)
		.replace(/###GALLERYLINK###/g, config.galleryLink)
		.replace(/###FANTOKENSYMBOL###/g, config.FanTknSymbol)
		.replace(/###COPYRIGHT###/g, configAdmin.copyRights)
		.replace(/###FBLINK###/g, configAdmin.facebookLink)
		.replace(/###TWITTERLINK###/g, configAdmin.twitterLink)
		.replace(/###INSTALINK###/g, configAdmin.instagramLink)
		.replace(/###LINKEDIN###/g, configAdmin.linkedinLink)
		.replace(/###YOUTUBELINK###/g, configAdmin.youtubeLink)
		.replace(/###TERMSURL###/g, termsUrl)
		.replace(/###PRIVACY###/g, privacyPolicyUrl)
		.replace(/undefined/g, "");

	values.subject = values.subject
		.replace(/###SITENAME###/g, configAdmin.siteName)
		.replace(/undefined/g, configAdmin.siteName);

	let mailOptions = {
		"from": {
			"address": smtpConfig.smtpDetails.email,
			"name": "noreply"
		},
		"to": [
			{
				"email_address": {
					"address": values.to,
					"name": values.to.split('@')[0]
				}
			}
		],
		"subject": values.subject + ' @ ' + setDate + ' ' + setTime,
		"htmlbody": values.html
	};

	if (typeof values.bcc == 'object' && values.bcc.length > 0) {
		let splitVal = chunk(values.bcc, 49);
		splitVal.forEach(async element => {
			for (let idx = 0; idx < element.length; idx++) {
				const email = element[idx];
				mailOptions.to = email;
				await client.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
					}
				});
			};
		});
	} else {
		await client.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.log(error);
			}
		});
	}
	callback(true);
};
function chunk(arr, len) {
	var chunks = [],
		i = 0,
		n = arr.length;

	while (i < n) {
		chunks.push(arr.slice(i, i += len));
	}
	return chunks;
}

let mailHTMLNew = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"> <head> <meta charset="UTF-8"> <meta content="width=device-width, initial-scale=1" name="viewport"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta content="telephone=no" name="format-detection"> <title>New Template</title> <style type="text/css"> #outlook a { padding: 0; } .es-button { mso-style-priority: 100 !important; text-decoration: none !important; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; } @media only screen and (max-width:600px) { p, ul li, ol li, a { line-height: 150% !important } h1, h2, h3, h1 a, h2 a, h3 a { line-height: 120% !important } h1 { font-size: 36px !important; text-align: left } h2 { font-size: 26px !important; text-align: left } h3 { font-size: 20px !important; text-align: left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size: 36px !important; text-align: left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size: 26px !important; text-align: left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size: 20px !important; text-align: left } .es-menu td a { font-size: 12px !important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size: 14px !important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size: 14px !important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size: 14px !important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size: 12px !important } *[class="gmail-fix"] { display: none !important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align: center !important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align: right !important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align: left !important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display: inline !important } .es-button-border { display: inline-block !important } a.es-button, button.es-button { font-size: 20px !important; display: inline-block !important } .es-adaptive table, .es-left, .es-right { width: 100% !important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important } .es-adapt-td { display: block !important; width: 100% !important } .adapt-img { width: 100% !important; height: auto !important } .es-m-p0 { padding: 0 !important } .es-m-p0r { padding-right: 0 !important } .es-m-p0l { padding-left: 0 !important } .es-m-p0t { padding-top: 0 !important } .es-m-p0b { padding-bottom: 0 !important } .es-m-p20b { padding-bottom: 20px !important } .es-mobile-hidden, .es-hidden { display: none !important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width: auto !important; overflow: visible !important; float: none !important; max-height: inherit !important; line-height: inherit !important } tr.es-desk-hidden { display: table-row !important } table.es-desk-hidden { display: table !important } td.es-desk-menu-hidden { display: table-cell !important } .es-menu td { width: 1% !important } table.es-table-not-adapt, .esd-block-html table { width: auto !important } table.es-social { display: inline-block !important } table.es-social td { display: inline-block !important } .es-m-p5 { padding: 5px !important } .es-m-p5t { padding-top: 5px !important } .es-m-p5b { padding-bottom: 5px !important } .es-m-p5r { padding-right: 5px !important } .es-m-p5l { padding-left: 5px !important } .es-m-p10 { padding: 10px !important } .es-m-p10t { padding-top: 10px !important } .es-m-p10b { padding-bottom: 10px !important } .es-m-p10r { padding-right: 10px !important } .es-m-p10l { padding-left: 10px !important } .es-m-p15 { padding: 15px !important } .es-m-p15t { padding-top: 15px !important } .es-m-p15b { padding-bottom: 15px !important } .es-m-p15r { padding-right: 15px !important } .es-m-p15l { padding-left: 15px !important } .es-m-p20 { padding: 20px !important } .es-m-p20t { padding-top: 20px !important } .es-m-p20r { padding-right: 20px !important } .es-m-p20l { padding-left: 20px !important } .es-m-p25 { padding: 25px !important } .es-m-p25t { padding-top: 25px !important } .es-m-p25b { padding-bottom: 25px !important } .es-m-p25r { padding-right: 25px !important } .es-m-p25l { padding-left: 25px !important } .es-m-p30 { padding: 30px !important } .es-m-p30t { padding-top: 30px !important } .es-m-p30b { padding-bottom: 30px !important } .es-m-p30r { padding-right: 30px !important } .es-m-p30l { padding-left: 30px !important } .es-m-p35 { padding: 35px !important } .es-m-p35t { padding-top: 35px !important } .es-m-p35b { padding-bottom: 35px !important } .es-m-p35r { padding-right: 35px !important } .es-m-p35l { padding-left: 35px !important } .es-m-p40 { padding: 40px !important } .es-m-p40t { padding-top: 40px !important } .es-m-p40b { padding-bottom: 40px !important } .es-m-p40r { padding-right: 40px !important } .es-m-p40l { padding-left: 40px !important } .es-desk-hidden { display: table-row !important; width: auto !important; overflow: visible !important; max-height: inherit !important } } @media screen and (max-width:384px) { .mail-message-content { width: 414px !important } } </style> </head> <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"> <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FAFAFA"> <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA"> <tr> <td valign="top" style="padding:0;Margin:0"> <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr> <td class="es-info-area" align="center" style="padding:0;Margin:0"> <table class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" bgcolor="#FFFFFF" role="none"> <tr> <td align="left" style="padding:20px;Margin:0"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" valign="top" style="padding:0;Margin:0;width:560px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" class="es-infoblock" style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#CCCCCC"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:14px;color:#CCCCCC;font-size:12px"> <a target="_blank" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px">View online version</a> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-header" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> <tr> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-header-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"> <tr> <td align="left" style="padding:20px;Margin:0"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td class="es-m-p0r" valign="top" align="center" style="padding:0;Margin:0;width:560px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" style="padding:0;Margin:0;padding-bottom:10px;font-size:0px"><img src="###LOGO###" alt="Logo" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;font-size:12px" width="200" title="Logo"></td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr> <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-left:20px;padding-right:20px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" valign="top" style="padding:0;Margin:0;width:560px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" class="es-m-p0r es-m-p0l es-m-txt-c" style="Margin:0;padding-top:15px;padding-bottom:15px;padding-left:40px;padding-right:40px"> <h1 style="Margin:0;line-height:55px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:46px;font-style:normal;font-weight:bold;color:#333333"> NVXO Exchange </h1> </td> </tr> <tr> <td align="left" style="padding:0;Margin:0;padding-top:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"> ###MAINCONTENT###</p>  </td> </tr> </table> </td> </tr> </table> </td> </tr> <tr> <td align="left" style="padding:0;Margin:0;padding-bottom:20px;padding-left:20px;padding-right:20px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-top:10px"> <h3 style="Margin:0;line-height:30px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:bold;color:#333333"> <br> </h3> </td> </tr> <tr> <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"> <br> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> <tr> <td align="center" style="padding:0;Margin:0"> <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" role="none"> <tr> <td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="left" style="padding:0;Margin:0;width:560px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px;font-size:0"> <table cellpadding="0" cellspacing="0" class="es-table-not-adapt es-social" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" valign="top" style="padding:0;Margin:0;padding-right:40px"><a href=###FBLINK###><img title="Facebook" src="https://eflqunf.stripocdn.email/content/assets/img/social-icons/logo-black/facebook-logo-black.png" alt="Fb" width="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a> </td> <td align="center" valign="top" style="padding:0;Margin:0;padding-right:40px"><a href=###TWITTERLINK###><img title="Twitter" src="https://res.cloudinary.com/ddokhzyw8/image/upload/v1742892049/rwo7nyui72ctb0zughkr.png" alt="Tw" width="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a> </td> <td align="center" valign="top" style="padding:0;Margin:0;padding-right:40px"><a href=###INSTALINK###><img title="Instagram" src="https://eflqunf.stripocdn.email/content/assets/img/social-icons/logo-black/instagram-logo-black.png" alt="Inst" width="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a> </td> <td align="center" valign="top" style="padding:0;Margin:0"><a href=###YOUTUBELINK###><img title="Youtube" src="https://eflqunf.stripocdn.email/content/assets/img/social-icons/logo-black/youtube-logo-black.png" alt="Yt" width="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a> </td> </tr> </table> </td> </tr> <tr> <td align="center" style="padding:0;Margin:0;padding-bottom:35px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px"> ###COPYRIGHT###</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px"> <br> </p> </td> </tr> <tr> <td style="padding:0;Margin:0"> <table cellpadding="0" cellspacing="0" width="100%" class="es-menu" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr class="links"> <td align="center" valign="top" width="33.33%" style="Margin:0;padding-left:5px;padding-right:5px;padding-top:5px;padding-bottom:5px;border:0"> <a target="_blank" href=###SITELINK### style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;display:block;font-family:arial, 'helvetica neue', helvetica, sans-serif;color:#333333;font-size:12px">Visit Us </a> </td> <td align="center" valign="top" width="33.33%" style="Margin:0;padding-left:5px;padding-right:5px;padding-top:5px;padding-bottom:5px;border:0;border-left:1px solid #cccccc"> <a target="_blank" href=###PRIVACY### style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;display:block;font-family:arial, 'helvetica neue', helvetica, sans-serif;color:#333333;font-size:12px">Privacy Policy</a> </td> <td align="center" valign="top" width="33.33%" style="Margin:0;padding-left:5px;padding-right:5px;padding-top:5px;padding-bottom:5px;border:0;border-left:1px solid #cccccc"> <a target="_blank" href=###TERMSURL### style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;display:block;font-family:arial, 'helvetica neue', helvetica, sans-serif;color:#333333;font-size:12px">Terms of Use</a> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr> <td class="es-info-area" align="center" style="padding:0;Margin:0"> <table class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" bgcolor="#FFFFFF" role="none"> <tr> <td align="left" style="padding:20px;Margin:0"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" valign="top" style="padding:0;Margin:0;width:560px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr> <td align="center" class="es-infoblock" style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#CCCCCC"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:14px;color:#CCCCCC;font-size:12px"> <a target="_blank" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"></a>No longer want to receive these emails? <a href="" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px">Unsubscribe</a>.<a target="_blank" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"></a> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </div> </body> </html>`;
