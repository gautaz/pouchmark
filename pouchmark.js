(function() {
	var getParam = function(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
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
	//PouchDB.debug.enable('*');
	var db = new PouchDB('benchmark');
	var puts = [];
	var ids = [];
	var start = new Date();
	var numDocs = parseInt(getParam('num'), 10) || 100;
	var index;

	for (index = 0; index < numDocs; ++index) {
		var doc = createDoc();
		ids.push(doc._id);
		puts.push(db.put(doc));
	}

	document.addEventListener("DOMContentLoaded", function() {
		document.getElementById('num').innerHTML = numDocs;
		Promise.all(puts).then(function() {
			var gets = [];
			document.getElementById('ms_put').innerHTML = new Date() - start;
			start = new Date();
			for (index = 0; index < ids.length; ++index) {
				gets.push(db.get(ids[index]));
			}
			return Promise.all(gets);
		}).then(function(getArray) {
			//var updates = [];
			document.getElementById('ms_get').innerHTML = new Date() - start;
			start = new Date();
			//for (index = 0; index < getArray.length; ++index) {
				//updates.push(db.put({
					//_id: getArray[index]._id,
					//_rev: getArray[index]._rev,
					//amount: Math.floor(Math.random() * 100000 - 50000) / 100,
				//}));
			//}
			//return Promise.all(updates);
		//}).then(function(updateArray) {
			var removes = [];
			//document.getElementById('ms_update').innerHTML = new Date() - start;
			//start = new Date();
			//for (index = 0; index < updateArray.length; ++index) {
				//removes.push(db.remove(updateArray[index]));
			//}
			for (index = 0; index < getArray.length; ++index) {
				removes.push(db.remove(getArray[index]));
			}
			return Promise.all(removes);
		}).then(function() {
			document.getElementById('ms_delete').innerHTML = new Date() - start;
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
