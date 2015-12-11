/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Angular module and controller definitions for menu
 *
 * @version 1.2
 * @author TCSASSEMBLER
 *
 * Changes in 1.1
 *  - Included menu for use not logged in
 *  - Refresh menu once user logs in or logs out
 *
 * Changes in version 1.2 (Project Mom and Pop - MiscUpdate5):
 * - [PMP-200] Show business picture in menu
 */

(function () {
    'use strict';

    angular
        .module('app.common.menu', [
            'app.components'
        ])
        .controller('MenuCtrl', MenuCtrl);


    MenuCtrl.$inject = ['$rootScope', '$scope', '$location', 'StorageService', 'GiftCardOfferService',
        'GiftCardService', 'UtilService', 'CartService'];


    // Main menu controller
    function  MenuCtrl($rootScope, $scope, $location, StorageService, GiftCardOfferService,
                       GiftCardService, UtilService, CartService) {
        $scope.user = {};
        $scope.vm = {};
        $scope.vm.menu = {};
        $scope.util = UtilService;

        $scope.vm.init = function () {
            var isAdmin = false,
                isIndividualUser = false;

            if (UtilService.isLoggedIn()) {
                var profile = StorageService.getCurrentUserProfile();
                $scope.user.firstName = profile.firstName;
                $scope.user.lastName = profile.lastName;
                if (profile.picture) {
                    $scope.user.picture = profile.picture;
                }
		if (profile.business) {
		    $scope.user.business = profile.business;
		}
                var businessId;
                angular.forEach(profile.userRoles, function (role) {
                    if (role.role === $scope.userRoles.BUSINESS_ADMIN || role.role === $scope.userRoles.BUSINESS_EMPLOYEE) {
                        businessId = role.businessId;
                        isAdmin = true;
                        $scope.user.title = 'BUSINESS OWNER';
                        if (role.role === $scope.userRoles.BUSINESS_EMPLOYEE) {
                            $scope.user.title = 'BUSINESS EMPLOYEE';
                        }
                    } else if (role.role === $scope.userRoles.INDIVIDUAL_USER) {
                        isAdmin = false;
                        isIndividualUser = true;
                        $scope.user.title = 'CHAMPION';
                    }
                });
            }
            if (isAdmin) {
                UtilService.getBusinessMenu().then(function (menu) {
                    $scope.vm.menu = menu;
                });

                GiftCardOfferService.search({pageNumber: 0, businessId: businessId}).then(function (data) {
                    var offers = data.items;
                    var amount = 0;
                    var totalRedeemed = 0;
                    $scope.user.cards = offers.length;
                    angular.forEach(offers, function (offer) {
                        amount = amount + offer.totalQuantity;
                        totalRedeemed = totalRedeemed + (offer.redeemedQuantity || 0);
                    });
                    $scope.user.amount = amount;
                    $scope.user.redeemed = parseInt((totalRedeemed / amount) * 100, 10) || 0;
                    calculateGauge($scope.user.redeemed);
                }, function (reason) {
                    alert(reason.error);
                });
            } else if (isIndividualUser) {
                UtilService.getChampionMenu().then(function (menu) {
                    $scope.vm.menu = menu;
                });

                GiftCardService.getMyGiftCards({pageNumber: 0}).then(function (data) {
                    var cards = data.items, total = 0;
                    $scope.user.cards = cards.length;
                    var reedemed = 0;
                    angular.forEach(cards, function (card) {
                        total = total + card.quantity;
                        reedemed += _.reduce(card.giftCardRedeems, function (memo, reedem) {
                            return memo + reedem.amount;
                        }, 0);
                    });
                    $scope.user.amount = total;
                    $scope.user.redeemed = reedemed || 0;
                }, function (reason) {
                    alert(reason.error);
                });
            } else {
                UtilService.getPublicMenu().then(function (menu) {
                    $scope.vm.menu = menu;
                });
            }

        };


        $scope.vm.menuClicked = function (title) {
            if (title.toLowerCase() === 'log out') {
                UtilService.logout();
                $scope.vm.init();
            }
            $scope.global.menuOpened = false;
        };

        $rootScope.$on('authScopeChanged', function (event) {
            $scope.vm.init();
        });

        $scope.vm.init();
        //is current path
        $scope.vm.isCurrentPath = function(el) {
            return $location.path() === '/'+el.href;
        };

        $scope.vm.getCount = function() {
            if ( (!CartService.giftOfferId) || CartService.giftOfferId === null) {
                return 0;
            } else {
                return 1;
            }

        };

        function calculateGauge(percent) {
            if (percent >= 100) {
                percent = 99;
            }
            $scope.gauge = {
                x: 32 + 29 * Math.sin(2 * Math.PI * percent / 100),
                y: 32 - 29 * Math.cos(2 * Math.PI * percent / 100),
                largeFlag: percent >= 50 ? 1 : 0
            };
        }

    }

})();
