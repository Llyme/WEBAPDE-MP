let logged_in = q("#info_send") != null;
let skip = 0;
let busy;
let _id = document.body.getAttribute("_id");
let view = document.body.getAttribute("view");
// Used to see which post to comment on.
let post_selected;
// Used to see which comment to reply on.
let comment_selected;

document.body.removeAttribute("_id");
document.body.removeAttribute("view");


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

function Card(doc) {
	let src = "dat/img/" + doc._id;

	let a = q("!a");
	a.className = "card";

	a.setAttribute("href", "post/post-" + doc._id);

	a.addEventListener("click", event => {
		event.stopPropagation();
		event.preventDefault();

		post_selected = doc._id;
		info_preview.src = src;
		info_space.innerHTML = "";

		if (doc.tag) {
			q("#info_tag").removeAttribute("hidden");
			q("#info_tag").innerHTML = doc.tag;
		} else
			q("#info_tag").setAttribute("hidden", 1);

		if (_id)
			if (doc.owner == _id)
				q("#info_share").removeAttribute("hidden");
			else
				q("#info_share").setAttribute("hidden", 1);

		info.removeAttribute("invisible");
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
	if (busy) return;

	// Make sure it will only request one at a time.
	busy = 1;

	r({
		method: "post",
		url: "user_view",
		headervalue: "application/x-www-form-urlencoded",
		data: {view, skip}
	}, docs => {
		if (docs == "-1")
			view = null;
		else try {
			docs = JSON.parse(docs);
			skip += 10;

			for (let i in docs) {
				// Setup tags.
				if (docs[i].tag.length)
					docs[i].tag = docs[i].tag.split(" ").map(
						v => "#" + v
					).join(" ");
				else
					docs[i].tag = null;

				Card(docs[i]);
			}
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
				post: post_selected,
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


//-- Setup for window behavior. --//

// Hide window when clicking outside.
info.addEventListener("click", event =>
	event.target == info && info.setAttribute("invisible", 1)
);


//-- Setup function for file uploading. --//

if (logged_in) {
	q("#account_upload").addEventListener("click", _ =>
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
}


//-- Setup automated requesting. --//

// Update everytime the user reaches the bottom of the page.
q("#main").addEventListener("wheel", function() {
	let main = q("#main");

	if (main.scrollHeight ==
		main.scrollTop + window.innerHeight)
		if (view)
			load_post();
	else {
		// No more memes. Destroy this event.
		main.removeEventListener("wheel", arguments.callee);

		let label = q("!label");
		label.innerHTML = "Woah! You reached the bottom!";

		q("#deck").appendChild(label);
	}
});


//-- Melee initialization. --//

// Grab the first 10 ASAP.
load_post();
