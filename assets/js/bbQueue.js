/**
 * Neat little queue system for 'connect-busboy'.
 * This will collect all fields first, then sends it back together.
**/

module.exports = (req, fields, callback) => {
	let data = {};
	let fn = k => {
		let i = fields.indexOf(k);

		if (i != -1)
			fields.splice(i, 1);

		if (!fields.length)
			callback(data);
	};

	req.busboy.on("field", (key, value) => {
		data[key] = value;

		fn(key);
	});

	req.busboy.on("file", (fieldname, file, filename) => {
		data[fieldname] = file;

		fn(fieldname);
	});

	req.pipe(req.busboy);
}