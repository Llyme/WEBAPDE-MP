/**
 * A simple middleware that creates a 'Hub-like' system for routing.
 *
 * Using the `*` character (/user/post/*) in a route will automatically
 * capture all incoming requests in that route if there are no callbacks
 * made for it. You can only do this once, and doing it again will
 * replace the previous. Only the direct route will be called
 * (`user/post/*` will only call `user/post/*`, not `user/*`).
**/
module.exports = (req, res, next) => {
	console.log(req.method, req.baseUrl, req.body);

	let n = 0;
	let debounce;
	let url = req.baseUrl.substr(1).toLowerCase().split("/");
	let method = req.method.toLowerCase();
	let base = module.exports[method];

	for (let i in url) {
		let v = url[i];

		if (!base[v])
			if (base["*"]) {
				debounce = base["*"](req, res, url);
				base = null;
				n++;

				break;
			} else {
				base = null;

				break;
			}
		else
			n++;

		base = base[v];
	}

	if (base) for (let i in base["/"])
		base["/"][i](req, res, url);
	else if (!debounce)
		if (n > 1) {
			req.baseUrl = "/" + url.splice(n - 1).join("/");

			if (method == "get")
				res.redirect(req.baseUrl);
			else
				module.exports(req, res, next);
		} else
			next();
};

{
	let l = ["get", "post"];
	let dummy_callback = _ => {};

	for (let i in l) module.exports[l[i]] = (url, callback) => {
		callback = callback || dummy_callback;

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

			if (i == "*") {
				base["*"] = callback;

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
