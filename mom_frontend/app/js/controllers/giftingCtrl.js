/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Gifting Controller
 *
 * @version 1.4
 * @author TCSASSEMBLER
 *
 * Changes in version 1.1
 * - update native alert to notify alert
 *
 * Changes in version 1.2
 * - Fix [PMP-179] Check if user is logged in
 *
 * Changes in version 1.3 (Project Mom and Pop - Release Fall 2015 Assembly):
 * - [PMP-223] Add slider
 *
 * Changes in version 1.4 (FOUNDERSHARE (AKA PMP) - GIFTING REVAMP)
 * - [PMP-261] Added Send to Google Friends feature
 */

angular.module("app")
    .controller('giftingCtrl', ['$scope', '$rootScope', 'GiftCardService', "GiftCardOfferService", "$routeParams", "$location", "$log", "notify", 'util',
	function ($scope, $rootScope, GiftCardService, GiftCardOfferService, $routeParams, $location, $log, notify, util) {
	    /* Fix [PMP-179] Check if user is logged in. If not,
	     * redirect to login page and then back here */
	    if (!util.isLoggedIn()) {
            $rootScope.tmp = {
                redirectUrl: '/FounderF$Gifting/'+$routeParams.id
            };
            $location.path('/Login');
            return;
	    }
	    $scope.shareText = "I just gifted a Founder$hare. What a great idea for a birthday gift! (hint hint ☺) www.foundershare.com";
        $scope.gift = {
		    amount: null
	    };
        GiftCardService.get($routeParams.id).then(function (giftCard) {
            GiftCardOfferService.getGiftCardOffer(giftCard.giftCardOfferId).then(function (offer) {
                $scope.giftCard = giftCard;
                $scope.gift.amount = Math.ceil(giftCard.quantity / 2);
                $scope.offer = offer;
                if (giftCard.quantity < 1) {
                    $location.path("/Founder$hares");
                }
            });
        }, function (reason) {
            notify({message: reason.error, templateUrl: 'partials/module/notify-popup.html'});
            $location.path("/Founder$hares");
        });
        var twitterApi, twitterToken, twitterTokenSecret;

        //handle rate limit error
        //we can do only 15 calls per 15 minute
        function handleTwitterError(err) {
            if (err && err.status === 429) {
                notify({message: "You made too many requests to Twitter. Please wait 15 min.", templateUrl: 'partials/module/notify-popup.html'});
            }
        }

	    //show modal with twitter friends
        $scope.showTwitterFriends = function () {
            OAuth.popup('twitter').done(function (result) {
                twitterToken = result.oauth_token;
                twitterTokenSecret = result.oauth_token_secret;
                twitterApi = result;
                result.get('/1.1/friends/list.json?count=200').done(function(data) {
                    if (data.users.length === 0) {
                        notify({message: "You have no friends on Twitter", templateUrl: 'partials/module/notify-popup.html'});
                        return;
                    }
                    $scope.twitterResponse = data;
                    $scope.twitterModal = true;
                    $scope.$apply();
                }).fail(handleTwitterError);
            }).fail(function (err) {
                $log.error('Error opening oauth.io popup ' + angular.toJson(err));
            });
        };
        //go to prev/next page in twitter modal
        $scope.showFriendPage = function (cursor) {
            twitterApi.get('/1.1/friends/list.json?cursor=' + cursor).done(function(data) {
                $scope.twitterResponse = data;
                $scope.$apply();
            }).fail(handleTwitterError);
        };
        //hide popup
        $scope.closeTwitterModal = function () {
            $scope.twitterModal = false;
        };
        //revert twitter selection
        $scope.deselectTwitterUser = function () {
            $scope.selectedTwitterFriend = null;
        };
        //set twitter selection
        $scope.selectTwitterFriend = function (user) {
            $scope.selectedTwitterFriend = user;
            $scope.twitterModal = false;
        };
        $scope.google = {
            api: null,
            searchText: '',
        };
        $scope.showGoogleFriends = function () {
            OAuth.popup('google').done(function (result) {
                $scope.google.api = result;
                $scope.googleModal = true;
                $scope.searchGoogle();
            }).fail(function (err) {
                $log.error('Error opening oauth.io popup ' + angular.toJson(err));
            });
        };
        $scope.searchGoogle = function () {
            $scope.google.api.get('/m8/feeds/contacts/default/full?alt=json&v=3.0&q=' + $scope.google.searchText).done(function(data){
                $scope.googleResponse = data.feed;
                $scope.$apply();
            }).fail(function (err) {
                $log.error('Error getting contacts');
            })
        };
        $scope.closeGoogleModal = function () {
            $scope.googleModal = false;
        };
        $scope.selectGoogleUser = function (user) {
            $scope.target.value = user.gd$email[0].address;
            $scope.googleModal = false;
        };
        $scope.paginateGoogleContacts = function (isNext) {
            var startIndex;
            if(isNext) startIndex = Number($scope.googleResponse.openSearch$itemsPerPage.$t)
                                        + Number($scope.googleResponse.openSearch$startIndex.$t);
            else startIndex = (Number($scope.googleResponse.openSearch$startIndex.$t)
                                        - Number($scope.googleResponse.openSearch$itemsPerPage.$t));
            startIndex = startIndex < 1
                ? 1
                : startIndex < Number($scope.googleResponse.openSearch$totalResults.$t)
                    ? startIndex
                    : Number($scope.googleResponse.openSearch$totalResults.$t);
            $scope.google.api.get('/m8/feeds/contacts/default/full?alt=json&v=3.0&start-index='+startIndex+'&q='+$scope.google.searchText)
                .done(function(data){
                    if(data.feed.entry.length === 0 ) {
                        notify({message: "You have no friends on Google", templateUrl: 'partials/module/notify-popup.html'});
                        return;
                    }
                    $scope.googleModal = true;
                    $scope.googleResponse = data.feed;
                    $scope.$apply();
            }).fail(function (err) {
                $log.error('Error getting contacts');
            })
        };
        $scope.hasNextGoogle = function () {
            return (Number($scope.googleResponse.openSearch$itemsPerPage.$t)
                + Number($scope.googleResponse.openSearch$startIndex.$t)) < Number($scope.googleResponse.openSearch$totalResults.$t)
        };
        $scope.hasPreviousGoogle = function () {
            return Number($scope.googleResponse.openSearch$startIndex.$t) > 1;
        };

        var submitting = false;
        $scope.target = {};
        $scope.extraMessage = {};
        //send a gift
        $scope.giftNow = function () {
            if (submitting || $scope.gifterForm.$invalid) {
                return;
            }
            if ($scope.giftCard.quantity < Number($scope.gift.amount)) {
                notify({message: "It looks like you're trying to gift more than you have. Your gift needs to be less than or equal to the total.", templateUrl: 'partials/module/notify-popup.html'});
                return;
            }
            if (Math.floor($scope.gift.amount) != $scope.gift.amount) {
                // Only full dollar amounts (no cents) are allowed
                $scope.gift.amount = Math.floor($scope.gift.amount);
                notify({message: "For now, gifts have to be in whole dollar amounts (no cents).", templateUrl: 'partials/module/notify-popup.html'});
                return;
            }
            submitting = true;
            var promise;
            if ($scope.selectedTwitterFriend) {
                promise = GiftCardService.sendGiftToTwitter($routeParams.id, {
                    "accessToken": twitterToken,
                    "accessTokenSecret": twitterTokenSecret,
                    friendId: $scope.selectedTwitterFriend.id_str,
                    quantity: Number($scope.gift.amount)
                });
            } else {
                var target = $scope.target.value;
                var type = target.indexOf("@") === -1 ? "PHONE_NUMBER" : "EMAIL";
                promise = GiftCardService.sendGift($routeParams.id, {
                    target: target,
                    quantity: Number($scope.gift.amount),
                    type: type,
                    extraMessage: $scope.extraMessage.value || undefined
                });
            }
            promise.then(function () {
                $scope.modalDone = true;
            }, function (res) {
                notify({message: res.error, templateUrl: 'partials/module/notify-popup.html'});
                submitting = false;
            });
        }
    }]);
