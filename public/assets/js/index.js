let logged_in = junksan._id != "";
let skip = 0;
// -1 = Not yet done; 0 = Done (No message); 1 = Done (With message).
let done = -1;
let busy;
// Used to see which post to comment on.
let post_selected;
// Used to see which comment to reply on.
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

function Card(doc) {
	let src = "dat/img/" + doc._id;

	let a = q("!a");
	a.className = "card";

	a.setAttribute("href", "post-" + doc._id);

	a.addEventListener("click", event => {
		event.stopPropagation();
		event.preventDefault();


		//-- Reset everything. --//

		post_selected = doc;
		info_preview.src = src;
		info_space.innerHTML = "";

		info.removeAttribute("invisible");


		//-- Set post owner. --//

		q("#info_owner")
			.setAttribute("href", "/user-" + doc.owner.username);
		q("#info_owner_img").src = "dat/avatar/0.jpg";
		q("#info_owner_name").innerHTML = doc.owner.nickname;


		//-- Set visibility for the tags. --//

		if (doc.tag_expanded) {
			q("#info_tag").removeAttribute("hidden");
			q("#info_tag").innerHTML = doc.tag_expanded;
		} else
			q("#info_tag").setAttribute("hidden", 1);


		//-- Set visibility for the share button. --//

		if (junksan._id) if (doc.owner._id == junksan._id)
			["#info_share", "#info_edit", "#info_delete"].map(v =>
				q(v).removeAttribute("hidden")
			);
		else
			["#info_share", "#info_edit", "#info_delete"].map(v =>
				q(v).setAttribute("hidden", 1)
			);

		load_comment(info_space, doc._id, 0);
	});

	let label = q("!label");
	label.innerHTML = doc.caption;

	let img = q("!img");
	img.src = src;

	img.setAttribute("draggable", false);

	a.appendChild(label);
	a.appendChild(img);
	deck.appendChild(a);
}


//-- Request generators. --//

function load_post() {
	if (busy || done != -1) return;

	// Make sure it will only request one at a time.
	busy = 1;

	r({
		method: "post",
		url: junksan.sort,
		headervalue: "application/x-www-form-urlencoded",
		data: {
			skip,
			tag: q("#sidebar_search").value
		}
	}, docs => {
		if (docs == "-1")
			done = 0;
		else try {
			docs = JSON.parse(docs);
			skip += docs.posts.length;

			docs.posts.map(doc => {
				doc.owner = docs.users[doc.owner];

				// Setup tags.
				if (doc.tag.length)
					doc.tag_expanded = doc.tag.split(" ").map(
						v => "#" + v
					).join(" ");

				Card(doc);
			});
		} catch(err) {}

		busy = 0;
	});
}

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
				docs.users[docs.comments[i].owner._id]
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


//-- Setup function for searching. --//

q("#sidebar_search").addEventListener("keydown", event => {
	if (event.keyCode == 13) {
		skip = 0;
		done = -1;

		q("#deck").innerHTML = "";

		load_post();
	}
});


//-- Setup for window behavior. --//

// Hide window when clicking outside.
info.addEventListener("click", event =>
	event.target == info && info.setAttribute("invisible", 1)
);


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
				post: post_selected._id,
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


	//-- Upload Functions. --//

	q("#sidebar_upload").addEventListener("click", _ =>
		q("#upload_form_file").click()
	);

	q("#upload_img").addEventListener("click", _ =>
		q("#upload_form_file").click()
	);

	q("#upload_cancel").addEventListener("click", _ =>
		q("#upload").setAttribute("invisible", 1)
	);

	q("#upload").addEventListener("click", event =>
		event.target == q("#upload") &&
		q("#upload").setAttribute("invisible", 1)
	);

	q("#upload_form_file").addEventListener("change", event => {
		let reader = new FileReader();

		reader.onload = event => {
			q("#upload_img").src = event.target.result;
			q("#upload_text").value = "";
			q("#upload_tag").value = "";
			q("#upload_privacy").value = "0";

			q("#upload").removeAttribute("invisible");
		};

		reader.readAsDataURL(event.target.files[0]);
	});

	q("#upload_submit").addEventListener("click", _ => {
		q("#upload_form_text").value = q("#upload_text").value;
		q("#upload_form_tag").value = q("#upload_tag").value;
		q("#upload_form_privacy").value = q("#upload_privacy").value;

		q("#upload_form").submit();
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
				post: post_selected._id,
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
		q("#edit_caption").value = post_selected.caption;
		q("#edit_tag").value = post_selected.tag;

		edit.removeAttribute("invisible");
	});

	q("#edit_confirm").addEventListener("click", _ => r({
		method: "post",
		url: "edit",
		headervalue: "application/x-www-form-urlencoded",
		data: {
			_id: junksan._id,
			post: post_selected._id,
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

		doc.caption = q("#edit_caption").value;
		doc.tag = q("#edit_tag").value;

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
					post: post_selected._id
				}
			}, res => {
				if (res == "1") nani(
					"Deleted... :(",
					"Your post will be missed...",
					null,
					i => location.reload()
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


	//-- Setup login/register functions. --//

	q("#sidebar_login_btn").addEventListener("click", function() {
		this.setAttribute("hidden", 1);
		q("#sidebar_login").removeAttribute("hidden");

		q("#login_uname").focus();

		q("#sidebar_reg_btn").removeAttribute("hidden");
		q("#sidebar_reg").setAttribute("hidden", 1);
	});

	q("#sidebar_reg_btn").addEventListener("click", function() {
		this.setAttribute("hidden", 1);
		q("#sidebar_reg").removeAttribute("hidden");

		q("#reg_uname").focus();

		q("#sidebar_login_btn").removeAttribute("hidden");
		q("#sidebar_login").setAttribute("hidden", 1);
	});
}


//-- Setup automated requesting. --//

// Update everytime the user reaches the bottom of the page.
q("#main").addEventListener("wheel", _ => {
	let main = q("#main");

	if (main.scrollHeight ==
		main.scrollTop + window.innerHeight)
		if (done == -1)
			load_post();
		else if (!done) {
			// No more memes. Destroy this event.
			done = 1;

			let label = q("!label");
			label.innerHTML = "Woah! You reached the bottom!";

			q("#deck").appendChild(label);
		}
});


//-- Melee initialization. --//

// Select the currently selected sort.
q("#sidebar div #" + junksan.sort).setAttribute("selected", 1);

// Grab the first 10 ASAP.
load_post();
