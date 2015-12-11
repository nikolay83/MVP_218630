/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Profile controller.
 *
 * Changes in version 1.1:
 *  - Refractor the user role related code.
 *
 * Changes in version 1.2:
 *  - Updated the password validation logic.
 *
 * Changes in version 1.3
 * - Replace native javascript alert with notify
 *
 * Changes in version 1.4
 * - Provision to edit last name, password for newly added platform admin
 *
 * Changes in version 1.5 (Project Mom and Pop - MiscUpdate5):
 * - [PMP-210] Fix change password
 *
 * Changes in version 1.6 (Project Mom and Pop - Release Fall 2015 Assembly):
 * - [PMP-220] Add subscribedToNews field
 * - [PMP-217] Disable save button while submitting
 * - Check for image file size
 *
 * @version 1.6
 * @author TCSASSEMBLER
 */
angular.module("app")
    .controller("profileCtrl", ['$scope', "$rootScope", 'SecurityService', '$location', 'storage', 'BusinessService', 'LookupService', 'UserService', '$log', 'config', 'util', 'notify',
        function ($scope, $rootScope, SecurityService, $location, storage, BusinessService, LookupService, UserService, $log, config, util, notify) {

	    $scope.password = {
		switchPassword: false,
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	    };
            $scope.user = storage.getCurrentUserProfile();
            $scope.Edit = false;
            $scope.submitted = false;
	    $scope.submitting = false;


            /**
             * Cancel password edit.
             */
            $scope.cancelPassword = function () {
		$scope.password.newPassword = '';
                $scope.password.confirmPassword = '';
                $scope.password.switchPassword = false;
                $scope.submitted = false;
		$scope.submitting = false;
            };

            /**
             * Save the password.
             */
            $scope.savePassword = function () {
                $scope.submitted = false;
                if ($scope.password.currentPassword === '' ||
		    $scope.password.newPassword === '' ||
		    $scope.password.confirmPassword === '') {
                    $scope.submitted = true;
                    return;
                }
                if ($scope.password.newPassword !== $scope.password.confirmPassword) {
                    $scope.submitted = true;
                    return;
                }

                if (SecurityService.checkPasswordLength($scope.password.newPassword)) {
                    notify({message: 'The password must have 8 chars at least.', templateUrl: 'partials/module/notify-popup.html'});
                    return;
                }
                if (!(SecurityService.checkPasswordContent($scope.password.newPassword))) {
                    notify({message: 'The password must contain both numbers and chars.', templateUrl: 'partials/module/notify-popup.html'});
                    return;
                }
                SecurityService.authenticate($scope.user.email, $scope.password.currentPassword).then(function (data) {

                    storage.storeSessionToken(data.sessionToken, false);

                    SecurityService.resetPassword($scope.password.newPassword).then(function (data) {
                        $scope.password.switchPassword = false;
                        $scope.password.currentPassword = '';
                        $scope.password.newPassword = $scope.password.confirmPassword = "";
                    }, function (reason) {
                        notify({message: "Failed to reset password.", templateUrl: 'partials/module/notify-popup.html'});
                        $log.log(reason);
                    });
                }, function (reason) {
                    notify({message: "The password is incorrect.", templateUrl: 'partials/module/notify-popup.html'});
                    $log.log(reason);
                });

            };

            $scope.$parent.isFounder = util.getUserRoles(util.BUSINESS_ADMIN);

            if ($scope.isFounder) {

                LookupService.getAllBusinessTypes().then(function (result) {
                    $scope.allBusinessTypes = result;
                    $scope.allBusinessTypesIndex = _.indexBy(result, 'id');

                    BusinessService.getMyBusiness().then(function (result) {
                        result.type = $scope.allBusinessTypesIndex[result.type];
                        $scope.readInfo = result;
                        if (!$scope.readInfo.type) {
                            $scope.readInfo.type = {};
                        }
                        $scope.editInfo = angular.copy(result);
                    })
                });
            }


            UserService.getMyUserProfile().then(function (data) {
                $scope.profileInfo = data;
                $scope.profileEditInfo = {};
                if (!$scope.profileInfo.location) {
                    $scope.profileInfo.location = '';
                }
                angular.copy($scope.profileInfo, $scope.profileEditInfo);

            }, function (reason) {
                $log.log(reason);
                notify({message: reason, templateUrl: 'partials/module/notify-popup.html'});
            });

            $scope.isInValidString = function (value) {
                if (!value || value.trim() === '') {
                    return true;
                }
                return false;
            };

            $scope.infoEdit = false;
            /**
             * Show the update user info fields.
             */
            $scope.showEditInfo = function () {
                $scope.infoEdit = !$scope.infoEdit;
            };
            /**
             * Save the info.
             * @param flows the upload file
             * @param form the html form
             */
            $scope.saveInfo = function (flows, form) {
		if ($scope.submitting) {
		    return;
		}
                $scope.submitted = false;
                if (form.$invalid) {
                    $scope.submitted = true;
                    return;
                }
		$scope.submitting = true;
                if (flows && flows.length > 0) {
                    var image = flows[0].file;
		    if (image.size > config.MAX_IMAGE_SIZE) {
			// Check if the image size is greater than max size
			notify({message: 'The image must be less than 800Kb', templateUrl: 'partials/module/notify-popup.html'});
			$scope.submitting = false;
			return;
		    }
                }
                UserService.updateMyUserProfile($scope.profileEditInfo, image).then(function (data) {
		    $scope.submitting = false;
                    angular.copy(data, $scope.profileInfo);
                    angular.copy(data, $rootScope.loggedUser);
                    $scope.infoEdit = false;
                    storage.storeCurrentUserProfile(data, true);
                }, function (reason) {
		    $scope.submitting = false;
                    $log.log(reason);
                    notify({message: reason.error, templateUrl: 'partials/module/notify-popup.html'});
                });
            };

            /**
             * Cancel the info edit.
             */
            $scope.cancelInfo = function () {
                $scope.submitted = false;
                $scope.infoEdit = false;
                angular.copy($scope.profileInfo, $scope.profileEditInfo);
            };

            $scope.edit = false;
            /**
             * Save business info.
             * @param flows the upload file
             * @param form the html form
             */
            $scope.saveBusiness = function (flows, form) {
		if ($scope.submitting) {
		    return;
		}
                $scope.submitted = false;
                if (form.$invalid || !$scope.editInfo.type.id) {
                    $scope.submitted = true;
                    return;
                }
		var image;
                if (flows && flows.length > 0) {
                    image = flows[0].file;
                } else if (!$scope.readInfo.picture) {
                    $scope.submitted = true;
                    return;
                }
		$scope.submitBusiness(image);
            };


            /**
             * Save business profile
             * @param image the business logo
             */
            $scope.submitBusiness = function (image) {
                var tmp = {};
                angular.copy($scope.editInfo, tmp);
                tmp.type = $scope.editInfo.type.id + '';
		$scope.submitting = true;
		UserService.updateMyUserProfile({
		    subscribedToNews: $scope.profileEditInfo.subscribedToNews
		}).then(function (data) {
		    BusinessService.updateMyBusinessProfile(tmp, image).then(function (data) {
			$scope.submitting = false;
			angular.copy($scope.editInfo, $scope.readInfo);
			$scope.edit = false;
			$rootScope.loggedUser.business = data;
			storage.storeCurrentUserProfile($rootScope.loggedUser, true);
                    }, function (reason) {
			$scope.submitting = false;
			notify({message: reason.error, templateUrl: 'partials/module/notify-popup.html'});
			$log.log(reason);
                    });
		});
            };

            /**
             * Edit business fields.
             */
            $scope.editBusiness = function () {
                $scope.edit = !$scope.edit;
            };

            /**
             * Cancel the business edit.
             */
            $scope.cancelBusiness = function () {
                angular.copy($scope.readInfo, $scope.editInfo);
                $scope.edit = false;
            };

            $scope.showContactInformation = function() {
                return $scope.isPlatformAdmin && !$scope.user.lastName;
            };

            $scope.savePlatformAdminInfo = function(platformAdminInfo) {
                UserService.updatePlatformAdmin(platformAdminInfo).then(function() {
                    notify({message: 'Updated successfully! Kindly login again.', templateUrl: 'partials/module/notify-popup.html'});
                    storage.clear();
                    $location.path('/Login');
                }, function(reason) {
                    notify({message: reason.error, templateUrl: 'partials/module/notify-popup.html'});
                });
            };
        }]);
