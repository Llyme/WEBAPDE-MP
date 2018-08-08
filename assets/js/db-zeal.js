/**
 * Asynchronously parse documents with different queries, then
 * filter the results.
**/
module.exports = (docs, parse, filter, callback) => {
	let data = [];
	let n = docs.length;

	for (let i in docs) {
		let v = parse(docs[i]);

		if (v) v.then(docs => {
			let v = filter(i, docs);

			if (v)
				data.push(v);

			n--;

			if (!n && callback)
				callback(data);
		}); else
			n--;
	}
};

/**
 * Asynchronously parse documents with different queries.
**/
module.exports.abstract = (queries, callback) => {
	let n = Object.keys(queries).length;
	let docs = {};

	for (let k in queries) queries[k].then(v => {
		docs[k] = v;
		n--;

		if (n == 0) {
			n = -1; // Debouncing.

			callback(docs);
		}
	});
};

/**
 * Asynchronously parse documents with 1 query.
**/
module.exports.constant = (_ids, query, callback) => {
	let n = _ids.length;
	let docs = [];

	for (let i = 0; i < _ids.length; i++) query(_ids[i]).then(v => {
		docs[i] = v;
		n--;

		if (n == 0) {
			n = -1; // Debouncing.

			callback(docs);
		}
	});
};
