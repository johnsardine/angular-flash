(function() {
    'use strict';
    var app = angular.module('flash', []),
        defaultLocation = 'default';

    app.run(['$rootScope', function($rootScope) {
        // initialize variables
        $rootScope.flashObject = {
            text: '',
            type: '',
            timeout: 5000,
            hasFlash: false,
            location: null,
            _timeOut: null
        };
        $rootScope.flash = {};
        $rootScope.flash[defaultLocation] = angular.copy($rootScope.flashObject);
    }]);

    // Directive for compiling dynamic html
    app.directive('dynamic', ['$compile', function($compile) {
        return {
            restrict: 'A',
            replace: true,
            link: function(scope, ele, attrs) {
                scope.$watch(attrs.dynamic, function(html) {
                    ele.html(html);
                    $compile(ele.contents())(scope);
                });
            }
        };
    }]);

    // Directive for closing the flash message
    app.directive('closeFlash', ['Flash', function(Flash) {
        return {
            require: '^flashMessage',
            link: function(scope, ele, attrs, flashMessage) {
                ele.on('click', function() {
                    Flash.dismiss(flashMessage.location);
                });
            }
        };
    }]);

    // Create flashMessage directive
    app.directive('flashMessage', ['$compile', '$rootScope', function($compile, $rootScope) {
        return {
            restrict: 'A',
            scope: {
                flashMessage: '=',
                flashMessageLocation: '@?'
            },
            controller: ['$scope', function($scope) {

                // Set default location
                if ( undefined === $scope.flashMessageLocation ) {
                    $scope.flashMessageLocation = defaultLocation;
                }

                this.location = $scope.flashMessageLocation;
            }],
            template: '<div role="alert" ng-show="flash.hasFlash" class="alert alert-location-{{flash.lo}} {{flash.addClass}} alert-{{flash.type}} alert-dismissible ng-hide alertIn alertOut "> <span dynamic="flash.text"></span> <button type="button" class="close" close-flash><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button> </div>',
            link: function(scope, ele, attrs) {
                // get timeout value from directive attribute and set to flash timeout
                var location = scope.flashMessageLocation;

                // Initiate location with flashObject copy
                $rootScope.flash[location] = angular.copy($rootScope.flashObject);

                // Save location name on location itself
                $rootScope.flash[location].location = location;

                // Save location timeout in seconds
                $rootScope.flash[location].timeout = parseInt(attrs.flashMessage, 10);

                // Push to local scope
                scope.flash = $rootScope.flash[location];
            }
        };
    }]);

    app.factory('Flash', ['$rootScope', '$timeout',
        function($rootScope, $timeout) {

            var dataFactory = {};

            // Create flash message
            dataFactory.create = function(type, text, addClass, location) {
                var $this = this;

                // Set default location
                if ( undefined === location || null === location ) {
                    location = defaultLocation;
                }

                // Cancel previuous timeout
                $timeout.cancel($rootScope.flash[location]._timeOut);

                // Set message type
                $rootScope.flash[location].type = type;

                // Set message text
                $rootScope.flash[location].text = text;

                // Add custom class if provided
                if ( addClass ) {
                    $rootScope.flash[location].addClass = addClass;
                }

                // Set message as hidden
                $rootScope.flash[location].hasFlash = false;

                // Set message as visible
                $timeout(function() {
                    $rootScope.flash[location].hasFlash = true;
                }, 100);

                // Create timeout and store in location
                $rootScope.flash[location]._timeOut = $timeout(function() {
                    // Dismiss message after timeout
                    $this.dismiss(location);
                }, $rootScope.flash[location].timeout);
            };

            // Create message at specific location
            dataFactory.toLocation = function(location, type, text, addClass) {
                dataFactory.create(type, text, addClass, location);
            };

            // Cancel flashmessage timeout function
            dataFactory.pause = function(location) {
                if ( undefined === location || null === location ) {
                    location = defaultLocation;
                }
                $timeout.cancel($rootScope.flash[location]._timeOut);
            };

            // Dismiss flash message
            dataFactory.dismiss = function(location) {
                if ( undefined === location || null === location ) {
                    location = defaultLocation;
                }
                $timeout.cancel($rootScope.flash[location]._timeOut);
                $timeout(function() {
                    $rootScope.flash[location].hasFlash = false;
                });
            };

            return dataFactory;
        }
    ]);
}());
