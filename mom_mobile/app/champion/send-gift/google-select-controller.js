/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Angular controller selecting Google friends modal
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */

(function () {
    'use strict';

    angular
        .module('app.champion.sendGift')
        .controller('SelectGoogleCtrl', SelectGoogleCtrl);

    SelectGoogleCtrl.$inject = ['$scope', '$modalInstance','googleApi'];

    //Google select controller
    function SelectGoogleCtrl ($scope, $modalInstance, googleApi) {
        $scope.vm = {};

        $scope.vm.searchFriends = searchFriends;
        $scope.vm.cancel = cancel;
        $scope.vm.friendSelected = friendSelected;

        return;

        function searchFriends (searchText) {
            return googleApi.get('/m8/feeds/contacts/default/full?alt=json&max-results=10&v=3.0&q='+searchText)
                .then(function(data){
                    if(data.feed.entry.length === 0 ) {
                        $scope.ms.showModal('id033', 'alert');
                        return;
                    }
                    return data.feed.entry.filter(function(entry) {
                        return !!entry.gd$email
                    });
                }).fail(function (err) {
                    $modalInstance.dismiss();
                    $scope.ms.showModal('id033', 'alert');
                })
        }

        //Close the modal
        function friendSelected() {
            $modalInstance.close($scope.vm.selectedFriend.gd$email[0].address);
        }

        //Cancel modal function
        function cancel() {
            $modalInstance.dismiss();
        }
    }
})();
