/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Register Controller
 *
 * Changes in version 1.1:
 *  - Updated the password validation logic.
 *
 * Changes in version 1.2:
 * - Open terms and conditions in popup window
 *
 * Changes in version 1.3
 * - Remove confirm password
 * - Accept any pending gift cards
 * - Replace native javascript alert with notify
 *
 * Changes in version 1.4
 * - Redirect user to /Home after successful signup
 *
 * Changes in version 1.5 (Project Mom and Pop - MiscUpdate5):
 * - Show error message when registration fails
 *
 * Changes in version 1.6 (Project Mom and Pop - Release Fall 2015 Assembly):
 * - [PMP-220] Add subscribedToNews field
 *
 * Changes in version 1.7:
 * - [PMP-251] Fix gift open process
 * - Check image file size
 *
 * Changes in version 1.8 (FOUNDERSHARE (AKA PMP) - GIFTING REVAMP)
 * - [PMP-278] Set isSignedUpWithEmailGiftLink flag
 *
 * @version 1.8
 * @author TCSASSEMBLER
 */

angular.module("app")
    .controller("registerCtrl", ['$scope', '$rootScope', '$log', '$location', 'LookupService', 'UserService', 'base64', 'util', '$window', 'SecurityService', 'config', '$http', 'GiftCardService', 'storage', 'notify',
    function ($scope, $rootScope, $log, $location, LookupService, UserService, base64, util, $window, SecurityService, config, $http, GiftCardService, storage, notify) {
        var acceptPendingGift = function(sessionToken) {
            var code = storage.getGiftToken();
            if(code) {
                $log.info('Accepting pending gift cards for newly registered user');
                GiftCardService.acceptGift(code, sessionToken).then(function() {
                    $log.info("pending gift card auto accepted successfully");
                    storage.clearGiftToken();
                })
            }
        };

        if($rootScope.tmp) {
            delete $rootScope.tmp.redirectUrl;
        }
        $rootScope.modal = true;
        $scope.subscribedToNews = true;
        $scope.accept = false;
        $scope.userImage = undefined;
        $scope.businessImage = undefined;
        $scope.showError = false;
        $scope.errorMessage = '';
        //Set Dropdown
        $scope.accountTypes = [
            {
                name: 'CHAMPION',
                value: 'Champion (Consumer)'
            },
            {
                name: 'FOUNDER',
                value: 'Business Owner'
            }
        ];
        $scope.accountType = {
            name: $scope.accountTypes[0].name,
            value: $scope.accountTypes[0].value
        };
        $scope.businessTypes = [];
        LookupService.getAllBusinessTypes().then(function (data) {
            $scope.businessTypes = data;
            $scope.businessType = {
                name: $scope.businessTypes.length > 0 ? $scope.businessTypes[0].name : '',
                id: $scope.businessTypes.length > 0 ? $scope.businessTypes[0].id : ''
            };
        }, function (reason) {
            $log.error('Error fetching business types. HTTP STATUS CODE [ ' + reason.status + ' ] Error [ ' + angular.toJson(reason.data) + ' ]');
        });

        $scope.setFile = function (flowFile) {
            if ($scope.accountType.name === 'FOUNDER') {
                $scope.businessImage = flowFile.file;
            } else {
                $scope.userImage = flowFile.file;
            }
        };

        $scope.closeRegistrationModal = function () {
            $scope.completeRegistrationModal = false;
        };
        $scope.completeRegistration = function (form, email) {
            if (form && form.$invalid) {
                return;
            }
            if (email) {
                $scope.registration.email = email;
            }

            if ($scope.userImage && $scope.userImage.size > config.MAX_IMAGE_SIZE) {
                notify({message: 'The image must be less than 800Kb', templateUrl: 'partials/module/notify-popup.html'});
                return;
            }

            if ($scope.businessImage && $scope.businessImage.size > config.MAX_IMAGE_SIZE) {
                notify({message: 'The image must be less than 800Kb', templateUrl: 'partials/module/notify-popup.html'});
                return;
            }

            $scope.registration.isSignedUpWithEmailGiftLink = !!storage.getGiftToken();
            UserService.register($scope.registration, $scope.userImage, $scope.businessImage).then(function (result) {
                $scope.modal = true;
                $scope.closeRegistrationModal();
                $scope.sessionToken = result.sessionToken;
            }, function (reason) {
                if (form) {
                    notify({message: reason.error, templateUrl: 'partials/module/notify-popup.html'});
                    return;
                }
                $scope.accountTypeModal = false;
                $scope.loginError = true;
                $scope.errorMsg = reason.error;
                $window.scrollTo(0, 200);
            });
        };

        var registerHelper = function (registration) {
            $scope.registration = registration;
            if (registration.linkedSocialNetwork === "TWITTER") {
                $scope.completeRegistrationModal = true;
                $scope.$apply();
            } else {
                $scope.completeRegistration($scope.form);
            }
        };

        $scope.register = function (user) {
            $scope.showError = false;
            if ($scope.accept) {
                $scope.submitted = true;
            }
            if (SecurityService.checkPasswordLength(user.password)) {
                $scope.showError = true;
                $scope.errorMessage = 'The password must have more than ' + config.PASSWORD_LENGTH + ' chars.';
                $window.scrollTo(0, 200);
                return;
            }
            if (!(SecurityService.checkPasswordContent(user.password))) {
                $scope.showError = true;
                $scope.errorMessage = 'The password must contain both numbers and chars.';
                $window.scrollTo(0, 200);
                return;
            }
            if ($scope.form.$valid && $scope.accept) {
                var registration;
                if ($scope.accountType.name === 'CHAMPION') {
                    registration = {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        password: user.password,
                        accountType: $scope.accountType.name,
                        email: user.email,
                        subscribedToNews: $scope.subscribedToNews
                    };
                } else if ($scope.accountType.name === 'FOUNDER') {
                    registration = {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        password: user.password,
                        accountType: $scope.accountType.name,
                        email: user.email,
                        subscribedToNews: $scope.subscribedToNews,
                        business: {
                            name: user.businessName,
                            type: Number($scope.businessType.id)
                        }
                    };
                }
                registerHelper(registration);
            }
        };
        $scope.registerWithSocialNetwork = function (socialNetwork) {
            if (socialNetwork === $scope.socialNetworks.facebook) {
                $scope.socialNetworkRegistration = true;
                OAuth.popup('facebook').done(function (result) {
                    var registration = {
                        linkedSocialNetwork: socialNetwork,
                        linkedSocialNetworkAccessToken: result.access_token,
                        accountType: $scope.accountType.name
                    };
                    registerHelper(registration);
                }).fail(function (err) {
                    $log.error('Error opening oauth.io popup ' + angular.toJson(err));
                });
            } else if (socialNetwork === $scope.socialNetworks.linkedin) {
                $scope.socialNetworkRegistration = true;
                OAuth.popup('linkedin2').done(function (result) {
                    var registration = {
                        linkedSocialNetwork: socialNetwork,
                        linkedSocialNetworkAccessToken: result.access_token,
                        accountType: $scope.accountType.name
                    };
                    registerHelper(registration);
                }).fail(function (err) {
                    $log.error('Error opening oauth.io popup ' + angular.toJson(err));
                });
            } else if (socialNetwork === $scope.socialNetworks.twitter) {
                OAuth.popup('twitter').done(function (result) {
                    var token = base64.encode(result.oauth_token + ':' + result.oauth_token_secret);
                    var registration = {
                        linkedSocialNetwork: socialNetwork,
                        linkedSocialNetworkAccessToken: token,
                        accountType: $scope.accountType.name
                    };
                    registerHelper(registration);
                }).fail(function (err) {
                    $log.error('Error opening oauth.io popup ' + angular.toJson(err));
                });
            }
        };
        $scope.closeModal = function () {
            $scope.modal = false;
            if($scope.sessionToken && $scope.socialNetworkRegistration) {
                util.loginHandler($scope.sessionToken);
            } else {
                $location.path('#/');
            }
        };

        $scope.modal = false;
        //serialize current input and open terms and conditions page
        $scope.openTerms = function (user) {
            var wnd = window.open("", "Terms & Conditions", "width=960, height=500");
            $http.get(config.TERMS_AND_CONDITIONS_URL).then(function (response) {
                wnd.document.write(response.data);
                $(wnd.document).find('head').prepend($('<link href="'+ window.location.origin +'/css/screen.css" rel="stylesheet" type="text/css">'));
            });
        }
    }]);
