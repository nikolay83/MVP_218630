/*
 * Copyright (c) 2015 TopCoder, Inc. All rights reserved.
 */

/**
 * Represents the schema for User.
 *
 * Changes in version 1.1:
 * - Added email verification logic.
 *
 * Changes in version 1.2 (Project Mom and Pop - Release Fall 2015 Assembly):
 * - [PMP-220] Add subscribedToNews
 * - [PMP-233] Add signedUpDate and verifiedDate
 *
 * Changes in version 1.3 (FOUNDERSHARE (AKA PMP) - GIFTING REVAMP)
 * - [PMP-278] Added isSignedUpWithEmailGiftLink
 *
 * @author TCSASSEMBLER
 * @version 1.3
 */
'use strict';

var mongoose = require('mongoose'),
    _ = require('underscore'),
    Const = require("../Const"),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

module.exports = new Schema({
    firstName: {type: String, required: true},
    lastName: String,
    email: String,
    email_lowered: String,
    location: String,
    picture: String,
    isFirstNamePublic: {type: Boolean, default: true},
    isLastNamePublic: {type: Boolean, default: true},
    isEmailPublic: {type: Boolean, default: true},
    isLocationPublic: {type: Boolean, default: true},
    isPicturePublic: {type: Boolean, default: true},
    isSignedUpWithEmailGiftLink: {type: Boolean, default: false},
    subscribedToNews: {type: Boolean, default: false},
    passwordHash: {type: String},
    userRoles: [{
        businessId: ObjectId,
        role: {
            type: String,
            enum: _.values(Const.UserRole)
        }
    }],
    linkedSocialNetwork: {type: String, enum: _.values(Const.SocialNetwork)},
    linkedSocialNetworkUserId: String,
    resetPasswordToken: String,
    resetPasswordExpired: Boolean,
    verifyEmailText: String,
    verifyEmailExpirationDate: {type: Date},
    signedUpDate: {type: Date, required: true, default: Date.now},
    verifiedDate: {type: Date}
});
