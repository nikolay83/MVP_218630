/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Represents utility service.
 *
 * @version 1.3
 * @author TCSASSEMBLER
 *
 * Changes in 1.1
 *  - Included function to get public menu
 *  - Included functions to get how it works and faq page data
 *  - Included function to get the messages for application modals
 *
 * Changes in 1.2
 *  - Included function to get users current location from browser
 *
 * Changes in 1.3 (Project Mom and Pop - Gift Card Offers Search and View)
 *  - If location is not allowed in browser, return location computed from IP address (getLocation method)
 */

/* Services */
(function () {
    'use strict';
    angular
        .module('app.components')
        .factory('UtilService', UtilService);

    UtilService.$inject = ['$http', '$log', '$q', '$rootScope', '$location', 'SecurityService', 'StorageService'];

    /**
     * Application utility service
     */
    function UtilService($http, $log, $q, $rootScope, $location, SecurityService, StorageService) {
        var service = {};

        service.getPublicMenu = function () {
            var deferred = $q.defer();
            // prepare http request object
            var req = {
                method: 'GET',
                url: 'assets/data/menuPublic.json'
            };
            $http(req).then(function (payload) {
                deferred.resolve(payload.data);
            }, function (reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        };

        service.getChampionMenu = function () {
            var deferred = $q.defer();
            // prepare http request object
            var req = {
                method: 'GET',
                url: 'assets/data/menuChampion.json'
            };
            $http(req).then(function (payload) {
                deferred.resolve(payload.data);
            }, function (reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        };

        service.getBusinessMenu = function () {
            var deferred = $q.defer();
            // prepare http request object
            var req = {
                method: 'GET',
                url: 'assets/data/menuEmployee.json'
            };
            $http(req).then(function (payload) {
                deferred.resolve(payload.data);
            }, function (reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        };

        service.getHowItWorks = function () {
            var deferred = $q.defer();
            // prepare http request object
            var req = {
                method: 'GET',
                url: 'assets/data/howItWorks.json'
            };
            $http(req).then(function (payload) {
                deferred.resolve(payload.data);
            }, function (reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        };

        service.getFAQ = function () {
            var deferred = $q.defer();
            // prepare http request object
            var req = {
                method: 'GET',
                url: 'assets/data/faq.json'
            };
            $http(req).then(function (payload) {
                deferred.resolve(payload.data);
            }, function (reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        };

        service.getMessages = function () {
            var deferred = $q.defer();
            // prepare http request object
            var req = {
                method: 'GET',
                url: 'assets/data/messages.json'
            };
            $http(req).then(function (payload) {
                deferred.resolve(payload.data);
            }, function (reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        };

        /**
         * This function is called in interval to refresh the session token
         */
        service.refreshToken = function () {
            $log.info('Refreshing sessionToken');
            var token = localStorage.getItem('momandpop.auth.token');
            if (token) {
                SecurityService.refreshToken(token).then(function (loginResult) {
                    StorageService.storeSessionToken(loginResult.sessionToken, true);
                    // get user profile
                    SecurityService.getMyUserProfile().then(function (user) {
                        StorageService.storeCurrentUserProfile(user, true);
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
            var profile = StorageService.getCurrentUserProfile();
            var sessionToken = StorageService.getSessionToken();
            return !!(profile && sessionToken);
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
            var user = StorageService.getCurrentUserProfile();
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
         * Logout user and clear the data
         */
        service.logout = function () {
            $rootScope.loggedIn = false;
            StorageService.clear();
            $location.path('/');
        };

        /**
         * Returns the current geo location
         * @returns {boolean} the check result.
         */
        service.getLocation = function () {
            var deferred = $q.defer();

            getLocation();
            return deferred.promise;

            function getLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (pos) {
                        deferred.resolve(pos.coords);
                    }, function () {
                        deferred.resolve(window.USER_LOCATION);
                    });

                } else {
                    deferred.resolve(window.USER_LOCATION);
                }
            }
        };

        return service;
    }

})();


