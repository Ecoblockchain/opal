describe('controllers', function() {
        var columns, episodeData, optionsData, Schema, schema, Episode;

        beforeEach(function() {
                module('opal.controllers');
                columns = [
                        {
                                name: 'demographics',
                                   single: true,
                                   fields: [
                                        {name: 'name', type: 'string'},
                                        {name: 'date_of_birth', type: 'date'},
                                ]},
                        {
                                name: 'location',
                                single: true,
                                fields: [
                                        {name: 'category', type: 'string'},
                                        {name: 'hospital', type: 'string'},
                                        {name: 'ward', type: 'string'},
                                        {name: 'bed', type: 'string'},
                                        {name: 'date_of_admission', type: 'date'},
                                        {name: 'tags', type: 'list'},
                                ]},
                        {
                                name: 'diagnosis',
                                single: false,
                                fields: [
                                        {name: 'condition', type: 'string'},
                                        {name: 'provisional', type: 'boolean'},
                                ]},
                ];

                episodeData = {
                        id: 123,
                        demographics: [{
                                id: 101,
                                name: 'John Smith',
                                date_of_birth: '1980-07-31'
                        }],
                        location: [{
                                category: 'Inepisode',
                                hospital: 'UCH',
                                ward: 'T10',
                                bed: '15',
                                date_of_admission: '2013-08-01',
                                tags: {'mine': true, 'tropical': true}
                        }],
                        diagnosis: [{
                                id: 102,
                                condition: 'Dengue',
                                provisional: true,
                        }, {
                                id: 103,
                                condition: 'Malaria',
                                provisional: false,
                        }]
                };

                optionsData = {
                        condition: ['Another condition', 'Some condition']
                }

                inject(function($injector) {
                        Schema = $injector.get('Schema');
                        Episode = $injector.get('Episode');
                });

                schema = new Schema(columns);
        });

        describe('EpisodeListCtrl', function() {
                var $scope, $cookieStore, $controller, $q, $dialog;
                var episodes, controller;

                beforeEach(function() {
                        inject(function($injector) {
                                $rootScope = $injector.get('$rootScope');
                                $scope = $rootScope.$new();
                                $cookieStore = $injector.get('$cookieStore');
                                $controller = $injector.get('$controller');
                                $q = $injector.get('$q');
                                $dialog = $injector.get('$dialog');
                        });

                        episodes = [new Episode(episodeData, schema)];
                        options = optionsData;

                        controller = $controller('EpisodeListCtrl', {
                                $scope: $scope,
                                $cookieStore: $cookieStore,
                                schema: schema,
                                episodes: episodes,
                                options: options
                        });
                });

                describe('newly-created controller', function() {
                        it('should have state "normal"', function() {
                                expect($scope.state).toBe('normal');
                        });
                });

                describe('adding an episode', function() {
                        it('should change stated to "modal"', function() {
                                $scope.addEpisode();
                                expect($scope.state).toBe('modal');
                        });

                        it('should set up the hospital number modal', function() {
                                var callArgs;

                                spyOn($dialog, 'dialog').andCallThrough();

                                $scope.addEpisode();

                                callArgs = $dialog.dialog.mostRecentCall.args;
                                expect(callArgs.length).toBe(1);
                                expect(callArgs[0].templateUrl).toBe('/templates/modals/hospital_number.html/');
                                expect(callArgs[0].controller).toBe('HospitalNumberCtrl');
                        });
                });

                describe('editing an item', function() {
                        it('should select that item', function() {
                                $scope.editItem(0, 0, 0);
                                expect([$scope.rix, $scope.cix, $scope.iix]).toEqual([0, 0, 0]);
                        });

                        it('should change state to "modal"', function() {
                                $scope.editItem(0, 0, 0);
                                expect($scope.state).toBe('modal');
                        });

                        it('should set up the demographics modal', function() {
                                var callArgs;

                                spyOn($dialog, 'dialog').andCallThrough();

                                $scope.editItem(0, 0, 0);

                                callArgs = $dialog.dialog.mostRecentCall.args;
                                expect(callArgs.length).toBe(1);
                                expect(callArgs[0].templateUrl).toBe('/templates/modals/demographics.html/');
                                expect(callArgs[0].controller).toBe('EditItemCtrl');
                        });

                        it('should open the demographics modal', function() {
                                var modalSpy;

                                modalSpy = {open: function() {}};
                                spyOn($dialog, 'dialog').andReturn(modalSpy);
                                spyOn(modalSpy, 'open').andReturn({then: function() {}});

                                $scope.editItem(0, 0, 0);

                                expect(modalSpy.open).toHaveBeenCalled();
                        });

                        it('should change state to "normal" when the modal is closed', function() {
                                var deferred, modalSpy;

                                deferred = $q.defer();
                                modalSpy = {open: function() {}};
                                spyOn($dialog, 'dialog').andReturn(modalSpy);
                                spyOn(modalSpy, 'open').andReturn(deferred.promise);

                                $scope.editItem(0, 0, 0);

                                deferred.resolve('save');
                                $rootScope.$apply();

                                expect($scope.state).toBe('normal');
                        });

                        it('should add a new item if result is "save-and-add-another"', function() {
                                var deferred, modalSpy;

                                deferred = $q.defer();
                                modalSpy = {open: function() {}};
                                spyOn($dialog, 'dialog').andReturn(modalSpy);
                                spyOn(modalSpy, 'open').andReturn(deferred.promise);

                                $scope.editItem(0, 0, 0);

                                spyOn($scope, 'editItem');
                                deferred.resolve('save-and-add-another');
                                $rootScope.$apply();

                                expect($scope.editItem).toHaveBeenCalledWith(0, 0, 1);
                        });
                });

                describe('adding an item', function() {
                        var iix;

                        beforeEach(function() {
                                iix = episodeData.diagnosis.length;
                        });

                        it('should select "Add"', function() {
                                $scope.editItem(0, 2, iix);
                                expect([$scope.rix, $scope.cix, $scope.iix]).toEqual([0, 2, iix]);
                        });

                        it('should change state to "modal"', function() {
                                $scope.editItem(0, 2, iix);
                                expect($scope.state).toBe('modal');
                        });

                        it('should set up the modal', function() {
                                var callArgs;

                                spyOn($dialog, 'dialog').andCallThrough();

                                $scope.editItem(0, 2, iix);

                                callArgs = $dialog.dialog.mostRecentCall.args;
                                expect(callArgs.length).toBe(1);
                                expect(callArgs[0].templateUrl).toBe('/templates/modals/diagnosis.html/');
                                expect(callArgs[0].controller).toBe('EditItemCtrl');
                                expect(callArgs[0].resolve.item().id).toBeUndefined();
                        });
                });

                describe('deleting an item', function() {
                        it('should do nothing if item is singleton', function() {
                                $scope.deleteItem(0, 0, 0);
                                expect($scope.state).toBe('normal');
                        });

                        it('should do nothing if item is new item', function() {
                                $scope.deleteItem(0, 2, 2);
                                expect($scope.state).toBe('normal');
                        });

                        it('should change state to "modal"', function() {
                                $scope.deleteItem(0, 2, 1);
                                expect($scope.state).toBe('modal');
                        });
                });
        });
});
