angular.module('opal.services')
    .factory('Item', function($http, $q) {
    return function(attrs, episode, columnSchema) {
	    var item = this;
        this.episode =  episode;

	    this.initialise = function(attrs) {
	        // Copy all attributes to item, and change any date fields to Date objects
	        var field, value;

            _.each(columnSchema.fields, function(field){
                delete item[field.name];
            })


	        angular.extend(item, attrs);
	        for (var fix = 0; fix < columnSchema.fields.length; fix++) {
		        field = columnSchema.fields[fix];
		        value = item[field.name];
		        if (field.type == 'date' && item[field.name] &&  !_.isDate(item[field.name])) {
		            // Convert values of date fields to Date objects
		            item[field.name] = moment(item[field.name], 'YYYY-MM-DD')._d;
		        };
	        };
	    };

	    this.columnName = columnSchema.name;
        this.sort = columnSchema.sort

	    this.makeCopy = function() {
	        var field, value;
	        var copy = {id: item.id};

	        for (var fix = 0; fix < columnSchema.fields.length; fix++) {
		        field = columnSchema.fields[fix];
		        value = item[field.name];
		        if (field.type == 'date' && item[field.name]) {
		            // Convert values of date fields to strings of format DD/MM/YYYY
		            copy[field.name] = moment(value).format('DD/MM/YYYY');
		        } else {
		            copy[field.name] = _.clone(value);
		        };
	        };

	        return copy;
	    };

        //
        // Save our Item to the server
        //
	    this.save = function(attrs) {
	        var field, value;
	        var deferred = $q.defer();
	        var url = '/' + this.columnName + '/';
	        var method;

	        for (var fix = 0; fix < columnSchema.fields.length; fix++) {
		        field = columnSchema.fields[fix];
		        value = attrs[field.name];
		        if (field.type == 'date' && attrs[field.name]) {
		            // Convert values of date fields to strings of format YYYY-MM-DD
		            if (angular.isString(value)) {
			            value = moment(value, 'DD/MM/YYYY');
		            } else {
			            value = moment(value);
		            };
		            attrs[field.name] = value.format('YYYY-MM-DD');
		        };
	        };

            // Tagging to teams are represented as a pseudo subrecord. 
            // Fake the ID attribute so we can know what episode we're tagging to.
            // 
            // We can't do this at initialization time because the episode has
            // not fully initialized itself at that point.
            // TODO: Refactor episode initialization.
            if (this.columnName == 'tagging') {
                item.id = episode.id;
                attrs.id = episode.id;
            }
            
	        if (angular.isDefined(item.id)) {
		        method = 'put';
		        url += attrs.id + '/';
	        } else {
		        method = 'post';
		        attrs['episode_id'] = episode.id;
	        }

	        $http[method](url, attrs).then(function(response) {
		        item.initialise(response.data);
		        if (method == 'post') {
		            episode.addItem(item);
		        };
		        deferred.resolve();
	        }, function(response) {
		        // handle error better
		        if (response.status == 409) {
		            alert('Item could not be saved because somebody else has \
recently changed it - refresh the page and try again');
		        } else {
		            alert('Item could not be saved');
		        };
	        });
	        return deferred.promise;
	    };

	    this.destroy = function() {
	        var deferred = $q.defer();
	        var url = '/' + item.columnName + '/' + item.id + '/';

	        $http['delete'](url).then(function(response) {
		        episode.removeItem(item);
		        deferred.resolve();
	        }, function(response) {
		        // handle error better
		        alert('Item could not be deleted');
	        });
	        return deferred.promise;
	    };

	    this.initialise(attrs);
    };
});