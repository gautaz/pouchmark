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
            amount: Big(Math.floor(Math.random() * 100000 - 50000) / 100),
            description: chance.sentence({
                word: 7
            })
        };
    };
    
    var idbAdapter = new lokiIndexedAdapter('lokimark');
    var lokidb = new loki('loki', { adapter: idbAdapter });
    var start;
    
    new Promise(function(resolve,reject) {
        document.addEventListener('DOMContentLoaded', resolve);
    }).then(function() {
        // Request Quota (only for File System API)  
        var requestedBytes = 1024 * 1024 * 100; // 50MB

        return new Promise(function(resolve, reject) {
            navigator.webkitPersistentStorage.requestQuota(
                requestedBytes, resolve,reject)
        });
    }).then(function(grantedBytes) {
        return new Promise(function(resolve, reject) {
            setTimeout(resolve, 1);
        });
    }).then(function() {
        return new Promise(function(resolve, reject) {
            console.log("Chargement...");
            lokidb.loadDatabase('entries',resolve);
        });
    }).then(function() {
        console.log("Chargment terminé.");
        // if database did not exist it will be empty so I will intitialize here
        var db = lokidb.getCollection('entries');
        if (db === null) {
          db = lokidb.addCollection('entries');
        }

        var puts = [];
        var ids = [];
        var numDocs = parseInt(getParam('num'), 10) || 100;
        var index;
        var sum = Big(0);
    
        console.log('Génération aléatoire des docs');
        for (index = 0; index < numDocs; ++index) {
            var doc = createDoc();
            ids.push(doc._id);
            sum = sum.plus(doc.amount);
    
            puts.push(doc);
        }
    
        console.log("Sum init : " + sum);

        document.getElementById('num').innerHTML = numDocs;
        console.log("put");
        start = new Date();
        
        for (var elt of puts) {
            db.insert(elt);
        }
        document.getElementById('ms_bulk_put').innerHTML = new Date() - start;

        console.log('bulk get');
        start = new Date();
        var alls = db.find();
        console.log("All docs : " + JSON.stringify(alls.length));

        document.getElementById('ms_bulk_get').innerHTML = new Date() - start;

        console.log('bulk get include docs');
        start = new Date();
        console.log('map/reduce for general balance');

        start = new Date();
        var result = db.mapReduce(
            function (obj) {
                return obj.amount;
            },
            function (array) {
                return array.reduce(function(prec,cur) { return Big(prec).plus(cur); }, Big(0));
            });
        document.getElementById('ms_mapreduce').innerHTML = new Date() - start;
        console.log("Balance with map/reduce : " + JSON.stringify(result));
        
        return new Promise(function(resolve,reject) {
            lokidb.saveDatabase(resolve);
        });
    }).then(function() {
        console.log("Save successfull");
        
        if (confirm("Souhaitez vous supprimer la base ?")) {
            var db = lokidb.getCollection('entries');
            console.log('remove');
            
    		start = new Date();
            for (let elt of db.find()) {
                db.remove(elt);
            }
            document.getElementById('ms_delete').innerHTML = new Date() - start;
    		console.log('destroy');
    		start = new Date();
    		idbAdapter.deleteDatabase('loki');
    		document.getElementById('ms_destroy').innerHTML = new Date() - start;
        }
    }).catch(function(error) {
        console.log("Erreur : " + error);
    });

    // 		console.log('remove');
    // 		var elements = result.rows;
    // 		var removes = [];
    // 		start = new Date();
    // 		for (index = 0; elements < elements.length; ++index) {
    // 			removes.push(db.remove(elements[index]));
    // 		}

    // 		return Promise.all(removes);
    // 	}).then(function() {
    // 		document.getElementById('ms_delete').innerHTML = new Date() - start;

    // 		start = new Date();
    // 	}).catch(function(err) {
    // 		console.log(new Date(), err);
    // 	});
    // });
})();
