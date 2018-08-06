/**
 * A simple middleware that creates a 'Hub-like' system for routing.
 *
 * 'Silencing' allows for automatically redirecting requests in
 * a 'silenced' route.
 *
 * Using the `!` character (/user/post/!) in a route will automatically
 * capture all incoming requests in that route (sadly, this will
 * disable any other callbacks).
**/
module.exports = (req, res, next) => {
	console.log(req.method, req.baseUrl, req.body);

	let url = req.baseUrl.substr(1).toLowerCase().split("/");
	let method = req.method.toLowerCase();
	let base = module.exports[method];

	for (let i in url) {
		let v = url[i];

		if (!base[v]) if (base["/!"]) {
			base["/!"](req, res, url);

			return;
		} else {
			base = null;

			break;
		}

		base = base[v];
	}

	if (base) for (let i in base["/"])
		base["/"][i](req, res, url);
	else
		next();
};

{
	let l = ["get", "post"];

	for (let i in l) module.exports[l[i]] = (url, callback) => {
		if (url instanceof Array) {
			for (let n in url)
				module.exports[l[i]](url[n], callback);

			return;
		}

		if (url[0] == "/")
			url = url.substr(1);

		url = url.toLowerCase().split("/");

		let base = module.exports[l[i]];

		while (url.length) {
			let i = url.shift();

			if (i == "!") {
				base["/!"] = callback;

				return;
			}

			if (!base[i])
				base[i] = {};

			base = base[i];
		}

		if (!base["/"])
			base["/"] = [];

		base["/"].push(callback);
	};
}
