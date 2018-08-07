let _id = document.body.getAttribute("_id");
let post = document.body.getAttribute("post");
let logged_in = q("#info_send") != null;
// Used to see which comment to reply on.
let comment_selected;

document.body.removeAttribute("_id");
document.body.removeAttribute("post");


//-- The text input when the user wants to reply to someone. --//

const comment_field = [
	q("!textarea"),
	q("!button")
];

comment_field[0].setAttribute("placeholder", "Comment here.");
comment_field[1].className = "info_send";
comment_field[1].innerHTML = "Send";
comment_field[1].setAttribute("button", 0);


//-- Generators. --//

function Comment(elm, doc, user) {
	let child;
	let url = "/user/user-" + user.username;

	let div = q("!div");
	div.innerHTML = "<a href=\"" + url + "\">" +
	user.nickname + "</a><br>";

	let img = q("!img");
	img.className = "avatar";
	img.src = "dat/avatar/0.jpg";

	div.appendChild(img);

	div.innerHTML += "<label>" + doc.text + "</label>";

	if (logged_in) {
		let button = q("!button");
		button.innerHTML = "reply";
		button.setAttribute("button", 0);
		button.addEventListener("click", _ => {
			if (!child) {
				child = q("!div");
				child.className = "comment_children";

				div.appendChild(child);
			}

			comment_selected = [child, doc._id];
			comment_field[0].value = "";

			child.insertBefore(comment_field[1], child.childNodes[0]);
			child.insertBefore(comment_field[0], child.childNodes[0]);

			comment_field[0].focus();
		});

		div.appendChild(button);

		for (let i = 0; i < 2; i++) {
			let img = q("!img");
			img.className = "comment_" + (i ? "downvote" : "upvote");
			img.src = "assets/img/blank.png";
			img.setAttribute("draggable", false);
			img.setAttribute("spritesheet", 1);
			img.addEventListener("click", _ => {
				if (img.getAttribute("active")) {
					img.removeAttribute("active");
				} else {
					img.setAttribute("active", 1);
				}
			});

			div.appendChild(img);
		}
	}

	if (doc.comments[0] || doc.comments == true) {
		child = q("!div");
		child.className = "comment_children";

		let button = q("!button");
		button.innerHTML = "view replies";
		button.setAttribute("button", 0);
		button.addEventListener("click", _ => {
			child.removeChild(button);
			load_comment(child, doc._id, 0, true);
		});

		div.appendChild(child).appendChild(button);
	}

	elm.appendChild(div);

	return child;
}


//-- Request generators. --//

function load_comment(elm, parent, skip, is_comment) {
	let data = {skip};

	if (is_comment)
		data.comment = parent;
	else
		data.post = parent;

	r({
		method: "post",
		url: "comment",
		headervalue: "application/x-www-form-urlencoded",
		data
	}, docs => {
		if (docs != "-1") try {
			docs = JSON.parse(docs);

			for (let i in docs.comments) Comment(
				elm,
				docs.comments[i],
				docs.users[docs.comments[i].owner]
			);

			if (docs.has_more) {
				let button = q("!button");
				button.innerHTML = "view more";
				button.setAttribute("button", 0);
				button.addEventListener("click", _ => {
					elm.removeChild(button);
					load_comment(
						elm,
						parent,
						skip + docs.comments.length,
						is_comment
					);
				});

				elm.appendChild(button);
			}
		} catch(err) {}
	});
}


//-- Setup function for commenting. --//

if (logged_in) {
	//-- Upload Functions. --//

	q("#info_send").addEventListener("click", _ => {
		let info_input = q("#info_input");

		r({
			method: "post",
			url: "reply",
			headervalue: "application/x-www-form-urlencoded",
			data: {
				post: _id,
				text: info_input.value
			}
		}, doc => { try {
			doc = JSON.parse(doc);

			Comment(info_space, doc.comment, doc.user);
		} catch(err) {} });

		info_input.value = "";
	});

	// Inline commenting.
	comment_field[1].addEventListener("click", _ => {
		if (!comment_selected)
			return;

		let elm = comment_selected[0];

		r({
			method: "post",
			url: "reply",
			headervalue: "application/x-www-form-urlencoded",
			data: {
				comment: comment_selected[1],
				text: comment_field[0].value
			}
		}, doc => { try {
			doc = JSON.parse(doc);

			Comment(elm, doc.comment, doc.user);
		} catch(err) {} });

		comment_field[0].value = "";
	});


	//-- Share Functions. --//

	q("#info_share").addEventListener("click", _ =>
		q("#share").removeAttribute("invisible", 1)
	);

	q("#share_submit").addEventListener("click", _ => {
		r({
			method: "post",
			url: "share",
			headervalue: "application/x-www-form-urlencoded",
			data: {
				post: post_selected,
				username: q("#share_text").value.toLowerCase()
			}
		});

		q("#share").setAttribute("invisible", 1);
	});

	q("#share_cancel").addEventListener("click", _ => {
		q("#share").setAttribute("invisible", 1);
	});

	q("#share").addEventListener("click", event =>
		event.target == q("#share") &&
		q("#share").setAttribute("invisible", 1)
	);
}


//-- Melee Initialization. --//

load_comment(info_space, _id, 0);

if (q("#info_tag").innerHTML.length)
	q("#info_tag").removeAttribute("hidden");