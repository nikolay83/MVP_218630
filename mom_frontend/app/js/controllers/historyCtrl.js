/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * History controller.
 *
 * Changes in version 1.1
 * - Replace native javascript alert with notify
 *
 * Changes in version 1.2
 * - Add checkFounder()
 * - Add sorting while fetching history
 *
 * Changes in version 1.3 (Project Mom and Pop - Release Fall 2015 Assembly):
 * - [PMP-225] Update History design
 *
 * @version 1.3
 * @author TCSASSEMBLER
 */

angular.module("app")
    .controller('historyCtrl', ['$scope', 'storage', 'UserService', '$log', 'util', 'BusinessService', 'notify',
        function ($scope, storage, UserService, $log, util, BusinessService, notify) {

            if ($scope.isUser) {
                UserService.getMyActions({pageNumber: 0, sortOrder: 'Descending', sortBy: 'timestamp'}).then(function (result) {
                    $scope.historyList = result.items;
                }, function () {
                    notify({message: "Cannot get history", templateUrl: 'partials/module/notify-popup.html'});
                });
            } else if ($scope.isFounder) {
                BusinessService.getMyBusinessActions({pageNumber: 0, sortOrder: 'Descending', sortBy: 'timestamp'}).then(function (result) {
                    $scope.historyList = result.items;
                }, function () {
                    notify({message: "Cannot get history", templateUrl: 'partials/module/notify-popup.html'});
                });
            }

	    // Check if logged in user is a founder
            $scope.checkFounder = function() {
                return $scope.isFounder && !$scope.isPlatformAdmin;
            }

	    // Get the icon url for a history type
	    $scope.getHistoryTypeIcon = function(type) {
		var basePath = "i/"
		switch (type) {
		case "GIFT_ACCEPTED":
		    return basePath + "gift_received.png";
		case "GIFTED":
		    return basePath + "gift_sent.png";
		case "PURCHASE":
		    return basePath + "purchase.png";
		case "REDEMPTION":
		    return basePath + "redemption.png";
		}
	    }

	    // Create a url for the target link
	    $scope.targetLink = function (target) {
	    if (/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(target)) {
		return 'mailto:' + target;
	    } else if (/^@.*/.test(target)) {
		return 'https://twitter.com/' + target;
	    } else {
		return 'tel:' + target;
	    }
	}
        }
    ]);
