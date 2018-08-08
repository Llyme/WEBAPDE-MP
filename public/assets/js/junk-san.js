/**
 * Collects all the data you dumped from hbs.
**/
const junksan = {};

{
	let elm = q("dump")[0];

	if (elm) {
		let l = elm.attributes;

		for (let i = 0; i < l.length; i++) {
			let v = l[i].value;

			try {
				v = JSON.parse(v);
			} catch(err) {}

			junksan[l[i].name] = v;
		}

		elm.parentNode.removeChild(elm);
	}
}