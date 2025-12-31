const Mongoose = require("mongoose");
//** db collection imported */
const Currency = Mongoose.model("Currency");
const Users = Mongoose.model("Users");
const Transactions = Mongoose.model("Transactions");
const ActiveDB = Mongoose.model("UserActivity");
const EmailTemplate = Mongoose.model("EmailTemplate");
const common = require("../helpers/common.helper");
const mail_helper = require("../helpers/mailHelper");
const query_helper = require("../helpers/query.helper");
/**
 * @description Transfer wallet amount in Options wallet to main wallet
 * @param {Object} walletBody
 * @returns {Promise<UserWallet>}
 */
const submitTransfer = async (req, res) => {
    try {
        if (common.getSiteDeploy() == 0) {
            let data = req.body;
            let userId = Mongoose.Types.ObjectId(req.userId);
            const orderwith = oArray.indexOf(userId.toString());
            if (orderwith == -1) {
                oArray.push(userId.toString())
                setTimeout(_intervalFunc, 5000, userId.toString());
                let currencyResult = await query_helper.findoneData(Currency, { currencyId: Mongoose.Types.ObjectId(data.currencyId), status: 1 }, {});
                if (currencyResult.status) {
                    currencyResult = currencyResult.msg;
                    currencyResult.USDvalue = currencyResult.currencySymbol == 'USDT' ? 1 : currencyResult.USDvalue;
                    if (currencyResult.status == 1) {
                        if (data.amount > 0) {
                            if (currencyResult.transferEnable == 1 || currencyResult.perpetualTransferEnable == 1) {
                                 //** Options wallet functionalities */
                                if (
                                    data.fromAccount == "Main Wallet" && currencyResult.perpetualTransferEnable == 1 && data.toAccount == "Options Wallet"
                                ) {
                                    
                                    let userResult = await query_helper.findoneData(Users, { _id: userId }, {});
                                    if (userResult.status) {
                                        userResult = userResult.msg;
                                        let walletOutput = await common.getbalance(userId, currencyResult.currencyId); //** user wallet details fetch */
                                        if (walletOutput) {
                                            let fromType = '', toType = '';
                                            if (data.fromAccount == 'Main Wallet') {
                                                fromType = 'amount';
                                                toType = 'perpetualAmount';
                                            } else {
                                                fromType = 'perpetualAmount';
                                                toType = 'amount';
                                            }
                                            if (walletOutput[fromType] < data.amount) {
                                                return res.json({ status: false, message: "Insufficient balance" })
                                            } else {
                                                let sendAmount = +data.amount;
                                                let values = {
                                                    userId: userId,
                                                    type: "Wallet Transfer",
                                                    txnId: data.fromAccount + " To " + data.toAccount,
                                                    amount: sendAmount,
                                                    receiveAmount: sendAmount,
                                                    usdAmount: sendAmount,
                                                    status: 1,
                                                    currencyId: currencyResult._id,
                                                    walletCurrencyId: currencyResult.currencyId
                                                }
                                                let insertedOutput = await query_helper.insertData(Transactions, values)
                                                if (insertedOutput.status) {
                                                    common.userNotification(userId, 'Wallet Transfer', 'You have Transferred ' + sendAmount + ' ' + currencyResult.currencySymbol + ' From ' + data.fromAccount + " To " + data.toAccount);
                                                    insertedOutput = insertedOutput.msg
                                                    let activity = common.activity(req);
                                                    activity.browser = (typeof activity.browser == 'string') ? activity.browser : loginType + ' Application';
                                                    let userActData = await query_helper.findoneData(ActiveDB, { userId: req.userId, ip: activity.ip, type: "Wallet Transfer" }, {})
                                                    if (!userActData.status) {
                                                        common.userNotify({
                                                            userId: req.userId,
                                                            reason: 'Wallet Transfer',
                                                            activity,
                                                            detail: {
                                                                transferId: insertedOutput._id,
                                                                amount: sendAmount,
                                                                currencySymbol: currencyResult.currencySymbol,
                                                                fromAccount: data.fromAccount,
                                                                toAccount: data.toAccount
                                                            }
                                                        });
                                                    }
                                                    let newbal = 0;
                                                    if (fromType == 'amount') {
                                                        newbal = (+walletOutput.amount) - (+data.amount)
                                                        newGameWalletAmt = (+walletOutput.optionsGameAmount) + (+data.amount)
                                                    } else {
                                                        newbal = (+walletOutput.amount) + (+data.amount)
                                                        newGameWalletAmt = (+walletOutput.optionsGameAmount) - (+data.amount)
                                                    }
                                                    await common.updateOptionsgameWalletAmount(userId, currencyResult.currencyId, +newGameWalletAmt, insertedOutput._id, ' From ' + data.fromAccount + " To " + data.toAccount);
                                                    let updateBalance = await common.updateUserBalance(userId, currencyResult.currencyId, newbal, insertedOutput._id, data.fromAccount + " To " + data.toAccount);
                                                    let configResult = await query_helper.findoneData(EmailTemplate, { hint: 'user-transfer' }, {})
                                                    if (updateBalance) {
                                                        if (configResult.status) {
                                                            configResult = configResult.msg;
                                                            let emailtemplate = configResult.content.replace(/###NAME###/g, userResult.username).replace(/###CURRENCY###/g, currencyResult.currencySymbol).replace(/###AMOUNT###/g, common.roundValuesMail(+data.amount, 8));
                                                            mail_helper.sendMail({ subject: configResult.subject + " - " + data.fromAccount + " To " + data.toAccount, to: userResult.email, html: emailtemplate }, (aftermail) => {
                                                            })
                                                        }
                                                        return res.json({ status: true, message: "Amount transferred successfully!" })
                                                    } else {
                                                        res.json({ status: false, message: "Oops! Something went wrong. Please try again" })
                                                    }
                                                    res.json({ status: true, message: "Amount transferred successfully!" })
                                                } else {
                                                    res.json({ status: false, message: "Oops! Something went wrong. Please try again" })
                                                }
                                            }

                                        } else {
                                            res.json({ status: false, message: "Oops! Something went wrong. Please try again" })
                                        }

                                    } else {
                                        res.json({ status: false, message: "Not a valid User" })
                                    }

                                } else {
                                    let message = data.fromAccount == 'Main Wallet' ? 'Main Wallet Transfer Disabled By Admin' : 'Wallet Transfer Disabled By Admin';
                                    res.json({ status: false, message: message })
                                }
                            } else {
                                res.json({ status: false, message: "Transfer for this currency is disabled" })
                            }
                        } else {
                            res.json({ status: false, message: "Please enter valid amount" })
                        }
                    } else {
                        res.json({ status: false, message: "Currency status is not in active state" })
                    }
                } else {
                    res.json({ status: false, message: "Not a valid currency" })
                }
            } else {
                setTimeout(_intervalFunc, 5000, userId);
                res.json({ status: false, message: "Please wait for 5 seconds before placing another request!" });
            }
        } else {
            return res.json({ status: false, message: "Please wait for 5 minutes before placing another request!" })
        }
    } catch (error) {
        console.log('submitTransfer error', e);
        res.json({ "status": false, "message": "Something went wrong" });
    }
};

//** time interval managed based on userId or userDetails */
let oArray = [];
function _intervalFunc(orderwith) {
    orderwith = orderwith.toString();
    var index = oArray.indexOf(orderwith);
    if (index > -1) {
        oArray.splice(index, 1);
    }
}
module.exports = {
    submitTransfer
}