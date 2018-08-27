let comment_selected;


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
	let url = "/user-" + user.username;

	let div = q("!div");
	div.innerHTML = "<a href=\"" + url + "\">" +
	user.nickname + "</a><br>";

	let img = q("!img");
	img.className = "avatar";
	img.src = "dat/avatar/0.jpg";

	div.appendChild(img);

	div.innerHTML += "<label>" + doc.text + "</label>";

	if (junksan._id) {
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

if (junksan._id) {
	//-- Upload Functions. --//

	q("#info_send").addEventListener("click", _ => {
		let info_input = q("#info_input");

		r({
			method: "post",
			url: "reply",
			headervalue: "application/x-www-form-urlencoded",
			data: {
				post: junksan.post,
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
		share.removeAttribute("invisible", 1)
	);

	q("#share_submit").addEventListener("click", _ => {
		r({
			method: "post",
			url: "share",
			headervalue: "application/x-www-form-urlencoded",
			data: {
				post: junksan.post,
				username: q("#share_text").value.toLowerCase()
			}
		});

		share.setAttribute("invisible", 1);
	});

	q("#share_cancel").addEventListener("click", _ =>
		share.setAttribute("invisible", 1)
	);

	share.addEventListener("click", event =>
		event.target == share && share.setAttribute("invisible", 1)
	);


	//-- Edit functions. --//

	q("#info_edit").addEventListener("click", _ => {
		q("#edit_caption").value = junksan.caption;
		q("#edit_tag").value = junksan.tag;

		edit.removeAttribute("invisible");
	});

	q("#edit_confirm").addEventListener("click", _ => r({
		method: "post",
		url: "edit",
		headervalue: "application/x-www-form-urlencoded",
		data: {
			_id: junksan._id,
			post: junksan.post,
			caption: q("#edit_caption").value,
			tag: q("#edit_tag").value
		}
	}, res => {
		if (res == "1") nani(
			"Successfully edited!",
			"Your post will be updated the next time you see it."
		); else nani(
			"Whoops!",
			"It looks like something went wrong...<br>Sorry about " +
			"that.",
			["Jeez..."]
		);

		junksan.caption = q("#edit_caption").value;
		junksan.tag = q("#edit_tag").value;

		q("#edit").setAttribute("invisible", 1);
	}));

	q("#edit_cancel").addEventListener("click", _ =>
		edit.setAttribute("invisible", 1)
	);

	edit.addEventListener("click", event =>
		event.target == edit && edit.setAttribute("invisible", 1)
	);


	//-- Delete functions. --//

	q("#info_delete").addEventListener("click", _ => nani(
		"Woah there!",
		"This will remove the post forever and it cannot be " +
		"undone! Are you really, really sure about this?",
		["Yes", "No"],
		i => {
			if (i == 0) r({
				method: "post",
				url: "delete",
				headervalue: "application/x-www-form-urlencoded",
				data: {
					_id: junksan._id,
					post: junksan.post
				}
			}, res => {
				if (res == "1") nani(
					"Deleted... :(",
					"Your post will be missed...",
					null,
					i => q("body !a href=/").click()
				); else nani(
					"Whoops!",
					"It looks like something went wrong...<br>Sorry " +
					"about that.",
					["Jeez..."]
				);
			});

			return 1;
		}
	));
} else {
	//-- Disable commenting. --//

	let fn = _ => nani(
		"Not Logged In!",
		"Sorry about that, but you need to login to comment " +
		"on this post."
	);

	q("#info_send").addEventListener("click", fn);
	q("#info_input").addEventListener("focus", function() {
		this.blur();
		fn();
	});
}


//-- Share Functions. --//

{
	let btn = q("#info_share");

	if (btn) {
		btn.addEventListener("click", _ =>
			q("#share").removeAttribute("invisible", 1)
		);

		q("#share_submit").addEventListener("click", _ => {
			r({
				method: "post",
				url: "share",
				headervalue: "application/x-www-form-urlencoded",
				data: {
					post: junksan.post,
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
}


//-- Melee Initialization. --//

if (junksan.has_comments)
	load_comment(info_space, junksan.post, 0);