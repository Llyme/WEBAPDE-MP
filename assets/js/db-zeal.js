/**
 * Asynchronous stepper for mongodb.
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