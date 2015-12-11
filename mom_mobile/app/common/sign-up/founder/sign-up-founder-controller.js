/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Angular controller definitions for founder sign up page
 *
 * @version 1.0
 * @author TCSASSEMBLER
 *
 */

(function () {
    'use strict';

    angular
        .module('app.common.signUp')
        .controller('SignUpFounderCtrl', SignUpFounderCtrl);

    SignUpFounderCtrl.$inject = ['$scope', '$location', '$rootScope', '$log', 'LookupService', '$modal', 'SignUpService', 'GLOBAL_OPTIONS'];


    //sign up founder Controller
    function SignUpFounderCtrl($scope, $location, $rootScope, $log, LookupService, $modal, SignUpService, GLOBAL_OPTIONS) {
        $scope.resetGlobal(GLOBAL_OPTIONS);
        $scope.businessTypes = [];
        LookupService.getAllBusinessTypes().then(function (types) {
            $scope.businessTypes = types;
        }, function (reason) {
            $log.error('Error fetching business types HTTP STATUS CODE [ ' + reason.status + ' ] Error [ ' + angular.toJson(reason.data) + ' ]');
        });
        $scope.requiredFields = {
        };
        // reset modal
        SignUpService.signUpUtil($scope, $location, $rootScope, $log, $modal);
        $scope.register = $scope.validateUtil;
    }
})();