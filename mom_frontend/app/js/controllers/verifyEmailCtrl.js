/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Verify email Controller
 *
 * Changes in version 1.1
 * - Replace native javascript alert with notify
 *
 * Changes in version 1.2:
 * - [PMP-251] Fix gift open process
 *
 * Changes in version 1.3:
 * - [PMPISSUES-21] Clear gift token in local storage after accepting gift
 *
 * Changes in version 1.4 (FOUNDERSHARE (AKA PMP) - GIFTING REVAMP)
 * - [PMP-278] Moved AcceptGift logic to loginHandler
 *
 * @version 1.4
 * @author TCSASSEMBLER
 */

angular.module("app")
    .controller("verifyEmailCtrl", ['$scope', '$routeParams', 'UserService', 'util', '$rootScope', 'notify', 'storage', '$log', 'GiftCardService', '$location', '$analytics', function ($scope, $routeParams, UserService, util, $rootScope, notify, storage, $log, GiftCardService, $location, $analytics) {

        UserService.verifyEmail($routeParams.userId, $routeParams.token).then(function (result) {
            $rootScope.tmp = undefined;
            util.loginHandler(result.sessionToken, true, function () {
                $analytics.eventTrack($rootScope.isFounder ? "Owner" : "Champion", {  category: 'Complete registration' });

            });
        }, function (reason) {
            $rootScope.tmp = {
                redirectUrl: '/'
            };
            notify({message: reason.error, templateUrl: 'partials/module/notify-popup.html'});
            return;
        });

    }]);
