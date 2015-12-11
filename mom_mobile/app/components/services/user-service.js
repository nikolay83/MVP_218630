/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Represents user service.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */

/* Services */
(function () {
    'use strict';
    angular
        .module('app.components')
        .factory('UserService', UserService);

    UserService.$inject = ['CommonService'];


    /**
     * Application UserService.
     * This service exposes user actions like getUserProfile, getMyUserProfile etc
     * All the methods in this service returns a promise.
     * When async opeartion finishes that promise would be resolved or rejected.
     * The promise would be resolved with actual response from Backend API and would be rejected be the reason
     */
    function UserService(CommonService) {
        var service = {};

        /**
         * Register the user on mom and pop platform
         * registration is registration entity object which would be converted to json string
         * userProfile and businessProfile are optional
         */
        service.register = function (registration, userImage, businessImage) {
            var data = new FormData();
            data.append('registration', angular.toJson(registration));
            if (userImage) {
                data.append('profileImage', userImage);
            }
            if (businessImage) {
                data.append('businessImage', businessImage);
            }
            // prepare request object
            var req = {
                method: 'POST',
                url: '/register',
                headers: {
                    'Content-Type': undefined
                },
                data: data
            };
            return CommonService.makeRequest(req);
        };

        /**
         * Get my user profile
         */
        service.getMyUserProfile = function () {
            var req = {
                method: 'GET',
                url: '/users/me'
            };
            return CommonService.makeRequest(req);
        };

        /**
         * Get current user actions.
         * @param criteria the search condition
         * @returns {Promise} the promise.
         */
        service.getMyActions = function (criteria) {
            var req = {
                method: 'GET',
                url: '/users/me/actions',
                params: criteria
            };
            return CommonService.makeRequest(req);
        };

        service.verifyEmail = function (userId, token) {
            var data = new FormData();
            var requestData = {userId: userId, token: token};
            data.append('requestData', angular.toJson(requestData));

            // prepare request object
            var req = {
                method: 'POST',
                url: '/verifyEmail',
                headers: {
                    'Content-Type': undefined
                },
                data: data
            };
            return CommonService.makeRequest(req);
        };
        return service;
    }

})();


