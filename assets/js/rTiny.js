// Tiny relay.
const r = (p, c) => {
	p.headervalue = p.headervalue ? p.headervalue : "application/json";

	let v = new XMLHttpRequest();
	v.onreadystatechange = e => (
		e.target.readyState == 4 &&
		e.target.status == 200 &&
		c && c(e.target.responseText)
	);

	v.open(p.method || "GET", p.url, true);
	v.setRequestHeader(
		p.headername || "Content-type",
		p.headervalue
	);

	if (r.index[p.headervalue])
		p.data = r.index[p.headervalue](p.data);

	v.send(p.data);
};

r.index = {
	"application/json": v => JSON.stringify(v)
};