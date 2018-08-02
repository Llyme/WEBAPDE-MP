const b64 = [];

for (let i = 65; i < 65+26; i++) 
	b64.push(String.fromCharCode(i));

for (let i = 97; i < 97+26; i++) 
	b64.push(String.fromCharCode(i));

for (let i = 48; i < 48+10; i++)
	b64.push(String.fromCharCode(i));

b64.push("+");
b64.push("/");

module.exports = v => {
	// To base-64.
	if (typeof(v) == "number") {
		let n = "";

		do {
			n = b64[v%64] + n;
			v = Math.floor(v/64);
		} while (v > 0);

		return n;
	}

	// To integer.
	let n = 0;
	let m = v.length - 1;

	for (let i in v) {
		let k = b64.indexOf(v[i])

		if (k == -1)
			return 0;

		n += 64**(m - i)*k;
	}

	return n;
}