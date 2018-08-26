/**
 * Popup manager.
 *
 * Requires: qTiny.js, maketh.js
**/

maketh.struct("static", {
	"position": "absolute",
	"display": "block"
});

maketh.struct("nani-div", {
	"top": "0",
	"left": "0",
	"width": "100%",
	"height": "100%"
}, "static");

maketh.struct("nani-dim", {
	"opacity": "0.6",
	"background-color": "#000"
}, "nani-div");

maketh.struct("nani-win", {
	"top": "50%",
	"left": "0",
	"right": "0",
	"width": "480px",
	"margin": "auto",
	"background-color": "#3a3a3e",
	"box-shadow": "0 0 2px #000",
	"border-radius": "8px",
	"transform": "translateY(-50%)"
}, "static");

maketh.struct("nani-head", {
	"display": "block",
	"margin": "8px",
	"margin-top": "16px",
	"color": "#fff",
	"font-weight": "lighter",
	"font-size": "24px",
	"text-align": "center"
});

maketh.struct("nani-body", {
	"display": "block",
	"margin": "8px",
	"margin-top": "16px",
	"margin-bottom": "24px",
	"padding": "0 16px",
	"color": "#fff",
	"font-size": "16px",
	"text-align": "center"
});

maketh.struct("nani-cho", {
	"position": "relative",
	"display": "inline-block",
	"bottom": "0",
	"left": "50%",
	"padding": "8px",
	"margin": "auto",
	"transform": "translateX(-50%)",
	"text-align": "center"
});

maketh.struct("nani-btn", {
	"display": "inline-block",
	"margin": "8px",
	"padding": "8px 16px",
	"border-radius": "6px",
	"box-shadow": "0 0 2px #000",
	"background-color": "#4a4a4e",
	"color": "#fff",
	"font-size": "14px",
	"text-align": "center",
	"transition": "0.1s",
	"cursor": "pointer"
});

maketh.struct("nani-btn:hover", {
	"background-color": "#5a5a5e"
});

maketh.struct("nani-btn:active", {
	"background-color": "#2a2a2e",
	"transition": "none"
});

const nani = (head_txt, body_txt, choices, callback, allow_leave) => {
	choices = choices || ["Okay"];

	let div = maketh(q("body !nani-div"), "nani-div");

	let dim = maketh(q("!nani-dim"), "nani-dim");
	div.appendChild(dim);

	dim.addEventListener("mousedown", _ => {
		if (allow_leave == null || allow_leave)
			div.remove();
	});

	let win = maketh(q("!nani-win"), "nani-win");
	div.appendChild(win);

	let head = maketh(q("!nani-head"), "nani-head");
	head.innerHTML = head_txt;
	win.appendChild(head);

	let body = maketh(q("!nani-body"), "nani-body");
	body.innerHTML = body_txt;
	win.appendChild(body);

	let cho = maketh(q("!nani-cho"), "nani-cho");
	win.appendChild(cho);

	for (let i in choices) {
		let btn = maketh(q("!nani-btn"), "nani-btn");
		maketh(btn).hover("nani-btn:hover");
		maketh(btn).active("nani-btn:active");
		btn.innerHTML = choices[i];
		cho.appendChild(btn);

		btn.addEventListener("click", _ =>
			(!callback || callback(i)) && div.remove()
		);
	}
};
