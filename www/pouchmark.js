(function() {
	/* global chance, PouchDB, Promise */
	'use strict';

	var getParam = function(name) {
		name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
			results = regex.exec(location.search);
		return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
	};

	var createDoc = function() {
		return {
			_id: chance.guid(),
			date: chance.date({
				year: Math.floor(Math.random() * 30 + 1980)
			}),
			amount: Math.floor(Math.random() * 100000 - 50000) / 100,
			description: chance.sentence({
				word: 7
			})
		};
	};

	window.PouchDB = PouchDB;
	var db = new PouchDB('benchmark', {
		size: 100
	});
	var puts = [];
	var ids = [];
	var start = new Date();
	var numDocs = parseInt(getParam('num'), 10) || 100;
	var index;
	var sum = 0.0;

	console.log('put');
	for (index = 0; index < numDocs; ++index) {
		var doc = createDoc();
		ids.push(doc._id);
		sum += doc.amount;

		// puts.push(db.put(doc));
		puts.push(doc);
	}

	console.log("Sum init : " + sum);

	var ddoc = {
		_id: '_design/my_index',
		views: {
			by_name: {
				map: function(doc) {
					emit(doc.date, doc.amount);
				}.toString(),
				reduce: '_sum'
			}
		}
	};

	// save it
	db.put(ddoc).then(function() {
		console.log("Design index added");
	}).catch(function(err) {
		// some error (maybe a 409, because it already exists?)
		console.log(err);
		if (err.status !== 409) {
			throw err;
		}
	});

	// db.bulkDocs(puts);
	document.addEventListener('DOMContentLoaded', function() {
		document.getElementById('num').innerHTML = numDocs;
		start = new Date();

		// Promise.all(puts).then(function() {
		db.bulkDocs(puts).then(function() {
			document.getElementById('ms_bulk_put').innerHTML = new Date() - start;

			console.log('bulk get');
			start = new Date();
			return db.allDocs();
		}).then(function() {
			document.getElementById('ms_bulk_get').innerHTML = new Date() - start;

			console.log('bulk get include docs');
			start = new Date();
			return db.allDocs({
				include_docs: true
			});
		}).then(function(result) {
			document.getElementById('ms_bulk_get_include_docs').innerHTML = new Date() - start;
			console.log('map/reduce for general balance');

			start = new Date();
			return db.query('my_index/by_name', {
				reduce: '_sum'
			});
		}).then(function(result) {
			document.getElementById('ms_mapreduce').innerHTML = new Date() - start;
			console.log('map/reduce for general balance 2 second');

			start = new Date();
			return db.query('my_index/by_name', {
				reduce: true
			});
		}).then(function(result) {
			console.log("Balance with map/reduce : " + JSON.stringify(result));
			document.getElementById('ms_mapreduce2').innerHTML = new Date() - start;

			console.log('remove');
			var elements = result.rows;
			var removes = [];
			start = new Date();
			for (index = 0; elements < elements.length; ++index) {
				removes.push(db.remove(elements[index]));
			}
		}).then(function() {
			document.getElementById('ms_delete').innerHTML = new Date() - start;

			console.log('destroy');
			start = new Date();
			return db.destroy();
		}).then(function() {
			document.getElementById('ms_destroy').innerHTML = new Date() - start;
			start = new Date();
		}).catch(function(err) {
			console.log(new Date(), err);
		});
	});
})();

// .then(function() {
// 	document.getElementById('ms_bulk_get').innerHTML = new Date() - start;

// 	console.log('get');
// 	start = new Date();
// 	var gets = [];
// 	for (index = 0; index < ids.length; ++index) {
// 		gets.push(db.get(ids[index]));
// 	}
// 	return Promise.all(gets);
// })
// .then(function(getArray) {
// 	document.getElementById('ms_get').innerHTML = new Date() - start;

// 	console.log('updates');
// 	start = new Date();

// 	var updates = [];
// 	for (index = 0; index < getArray.length; ++index) {
// 		updates.push(db.put({
// 			_id: getArray[index]._id,
// 			_rev: getArray[index]._rev,
// 			amount: Math.floor(Math.random() * 100000 - 50000) / 100,
// 		}));
// 	}
// 	return Promise.all(updates);
// }).then(function(updateArray) {
// 	document.getElementById('ms_update').innerHTML = new Date() - start;
// 	return db.allDocs();
// })
