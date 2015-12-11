/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Application utility service
 *
 * Changes in version 1.1:
 *  - Added getUserRoles() method.
 *
 * Changes in version 1.2:
 *  - Add support for redirect after login
 *
 * Changes in version 1.3:
 *  - Updated loginHandler and logout method to handle login page redirect.
 *
 * Changes in version 1.4:
 *  - Add pendingComment login to loginHandler
 *
 * Changes in version 1.5
 * - Replace native javascript alert with notify
 *
 * Changes in version 1.6:
 * - [PMP-251] Add callback parameter to loginHandler
 * - [PMP-252] Check if business payment method is verified
 *
 * Changes in version 1.7 (FOUNDERSHARE (AKA PMP) - GIFTING REVAMP)
 * - [PMP-278] Moved AcceptGift logic here
 *
 * @version 1.7
 * @author TCSASSEMBLER
 */
'use strict';

angular.module("app")
    .factory('util', ['$log', '$rootScope', 'SecurityService', 'UserService', 'GiftCardOfferService', 'BusinessService', 'storage', '$location', 'notify', 'GiftCardService', function ($log, $rootScope, SecurityService, UserService, GiftCardOfferService, BusinessService, storage, $location, notify, GiftCardService) {
        var service = {};

        /**
         * This function is called in interval to refresh the session token
         */
        service.refreshToken = function () {
            $log.info('Refreshing sessionToken');
            var token = storage.getSessionToken(true);
            if (token) {
                SecurityService.refreshToken(token).then(function (loginResult) {
                    storage.storeSessionToken(loginResult.sessionToken, true);
                    // get user profile
                    UserService.getMyUserProfile().then(function (user) {
                        storage.storeCurrentUserProfile(user, true);
                    }, function (userReason) {
                        $log.error('Error fetching current user profile ' + userReason);
                    });
                }, function (reason) {
                    // some error occurred
                    $log.error('Session Token Refresh Error ' + reason);
                });
            }
        };

        /**
         * Function to check if any user is currently logged in
         */
        service.isLoggedIn = function () {
            var profile = storage.getCurrentUserProfile();
            var sessionToken = storage.getSessionToken();
            return !!(profile && sessionToken);

        };

        service.getCartItemNumber = function () {
            var items = storage.getItemFromCart();
            if (items) {
                return items.length;
            }
            return 0;
        };

        service.BUSINESS_ADMIN = 'BUSINESS_ADMIN';
        service.BUSINESS_EMPLOYEE = 'BUSINESS_EMPLOYEE';
        service.PLATFORM_EMPLOYEE = 'PLATFORM_EMPLOYEE';
        service.INDIVIDUAL_USER = 'INDIVIDUAL_USER';
        /**
         * Get user role by key.
         * @param key the role key
         * @returns {boolean} the check result.
         */
        service.getUserRoles = function (key) {
            var user = storage.getCurrentUserProfile();
            if (!user) {
                return false;
            }
            for (var i = 0; i < user.userRoles.length; i++) {
                if (user.userRoles[i].role === key) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Login user by token
         * @param token the access token
         * @param rememberMe the flag if remember login
	 * @param Function() callback If set, the callback is called
	 *   instead of redirecting the user after handling login
         */
        service.loginHandler = function (token, rememberMe, callback) {
            storage.storeSessionToken(token, rememberMe);
            UserService.getMyUserProfile().then(function (data) {
                $rootScope.loggedUser = data;
                storage.storeCurrentUserProfile(data, rememberMe);
                $rootScope.isFounder = service.getUserRoles(service.BUSINESS_ADMIN);
                $rootScope.isUser = service.getUserRoles(service.INDIVIDUAL_USER);
                $rootScope.isPlatformAdmin = service.getUserRoles(service.PLATFORM_EMPLOYEE);
                //if user is a founder, check if the business is setup
                if ($rootScope.isFounder) {
                    BusinessService.getMyBusiness().then(function (business) {
                    $rootScope.isVerificationFeePaid = business.isVerificationFeePaid;
                    });
                }
                if ($rootScope.tmp && $rootScope.tmp.pendingComment) {
                    var offerId = $rootScope.tmp.pendingComment.giftCardOfferId;
                    var comment = $rootScope.tmp.pendingComment.comment;
                    delete $rootScope.tmp.pendingComment;
                    GiftCardOfferService.createGiftCardOfferComment(offerId, comment).then(function () {
                        $location.url('/?offerId=' + offerId);
                    }, function () {
                        $location.url('/?offerId=' + offerId);
                        notify({message: 'Cannot create comment', templateUrl: 'partials/module/notify-popup.html'});
                    });
                    return;
                }
                if (service.getUserRoles(service.BUSINESS_EMPLOYEE)) {
                    notify({message: 'Business employee are not allowed to log in.', templateUrl: 'partials/module/notify-popup.html'});
                    storage.clear();
                    return;
                }
                if ($rootScope.tmp && $rootScope.tmp.redirectUrl) {
                    $location.url($rootScope.tmp.redirectUrl);
                    $rootScope.tmp.redirectUrl = null;
                    return;
                }
                if (callback) {
                    return callback();
                }
                if (service.getUserRoles(service.PLATFORM_EMPLOYEE)) {
                    $location.path('/FounderStatus');
                } else {
                    var code = storage.getGiftToken();
                    if (code) {
                        $log.info('Accepting pending gift cards for newly registered user');
                        GiftCardService.acceptGift(code, token).then(function (gift) {
                            if (!$rootScope.tmp) {
                                $rootScope.tmp = {};
                            }
                            $rootScope.tmp.giftOpened = gift;
                            storage.clearGiftToken();
                            $location.path('/Founder$hares');
                        }, function (err) {
                            $log.error(err);
                            storage.clearGiftToken();
                            $location.path('/Founder$hares');
                        })
                    } else {
                        $location.path('/Founder$hares');
                    }
                }
            }, function (profileReason) {
                $log.error('Error fetching user profile HTTP STATUS CODE [ ' + profileReason.status + ' ] Error [ ' + angular.toJson(profileReason.data) + ' ]');
            });
        };

        /**
         * Logout user and clear the data
         */
        service.logout = function () {
            if ($rootScope.tmp) {
                delete $rootScope.tmp;
            }
            storage.clear();
            $rootScope.loggedUser = null;
            $rootScope.isFounder = false;
            $rootScope.isUser = false;
            $rootScope.isPlatformAdmin = false;
	    $rootScope.isVerificationFeePaid = false;
            $location.path('/Login');
        };

        return service;
    }]);
