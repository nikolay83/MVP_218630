/*
 * Copyright (c) 2015 TopCoder, Inc. All rights reserved.
 */

/**
 * Retrieves all pending gifts.
 * Feature for [PMP-282] - Requested in http://apps.topcoder.com/forums/?module=Thread&threadID=872443&mc=8
 * Options supported are:
 *  -a Price of Gift
 *  -u UserId of user who sent gift
 *  -e Email Of user who sent gift
 *  -b Business ID of gift
 *  -n Business Name of gift
 *  -t Timestamp. Shows only gifts created after this time stamp
 * Usage:
 * node test_files/pending-gifts.js -a 10 -u 566675ab7f50c9010069717c -e creativelyahead@gmail.com
 *  -b 566675ab7f50c9010069717c -n 'Valencia Pizza & Pasta' -t 'Dec 10 2015 10:24:34 GMT+0000'
 *
 * This will export pending-gifts.csv file in mom_api/ folder.
 *
 * @author TCSASSEMBLER
 * @version 1.0
 *
 */
"use strict";

var async = require('async');
var argv = require('minimist')(process.argv.slice(2));
var logging = require("../src/common/logging");
var logger = logging.logger;
var Const = require("../src/Const");
var GiftCard = require('../src/models').GiftCard;
var User = require('../src/models').User;
var GiftCardGift = require('../src/models').GiftCardGift;
var fs = require('fs');

/**
 * Check if gifts have expired
 */
function exportPendingGifts() {
    var filters = {
        isDelivered: true,
        status: Const.GiftCardGiftStatus.PENDING
    };
    var giftFilters = {};
    var csv = 'code, target, Amount, createdAt, id \n';
    if (argv.u) giftFilters['ownerId'] = argv.u;
    if (argv.b) giftFilters['businessId'] = argv.b;
    if (argv.n) giftFilters['businessName'] = argv.n;
    if (argv.a) filters['quantity'] = argv.a;
    if (argv.t) filters['createdAt'] = {
        $gt: argv.t
    };

    async.waterfall([
        function (cb) {
            if(argv.e) {
                User.findOne({
                    email: argv.e
                }, cb)
            } else cb (null, null);
        }, function (user, cb) {
            if(user) {
                giftFilters['ownerId'] = user.id;
            }
            GiftCard.find(giftFilters, cb);
        }, function (gifts, cb) {
            if(gifts) {
                filters['sourceGiftCardId'] = {
                    $in: gifts.map(function (item) { return item.id })
                };
            } else {
                filters['sourceGiftCardId'] = {
                    $in: []
                }
            }
            cb ();
        }, function (cb) {
            GiftCardGift.find(filters, cb);
        }, function (gifts, cb) {
            console.log(gifts.length + " Gifts Retrieved for provided filters");
            async.forEach(gifts, function (gift, cb) {
                csv += gift.code + ', '
                    + gift.metadata.target + ', '
                    + gift.quantity + ', '
                    + gift.createdAt.toString() + ', '
                    + gift.id + '\n';
                cb();
            }, cb);
        }, function (cb) {
            fs.writeFile('pending-gifts.csv', csv, cb);
        }
    ], function (err) {
        if (err) {
            logging.logError("exportPendingGifts", err);
        }
        console.log("Results are exported. Look for pending-gifts.csf file in current folder.");
        process.exit(0);
    });
}

exportPendingGifts();
