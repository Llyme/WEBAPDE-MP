// Tiny jQuery.
const q = (a, b) => { if (b == null) switch(a[0]) {
	case "#":
		return document.getElementById(a.substr(1));
	case ".":
		return document.getElementsByClassName(a.substr(1));
	case "!":
		return document.createElement(a.substr(1));
	default:
		return document.getElementsByTagName(a);
} else switch(b[0]) {
	case "#":
		let l = a.childNodes;
		b = b.substr(1);

		for (let i in l) if (l[i].id === b)
			return l[i];

		return null;
	case ".":
		return a.getElementsByClassName(b.substr(1));
	default:
		return a.getElementsByTagName(b);
}};

// Tiny relay.
const r = (p, c) => {
	let v = new XMLHttpRequest();
	v.onreadystatechange = e => (
		e.target.readyState == 4 &&
		e.target.status == 200 &&
		c && c(e.target.responseText)
	);

	v.open(p.method || "GET", p.url, true);
	v.setRequestHeader(
		p.headername || "Content-type",
		p.headervalue || "application/x-www-form-urlencoded"
	);
	v.send(p.data);
}

const e = {
	profile: q("#profile"),
	signup: q("#signup"),
	signup_username: q("#regusername"),
	signup_password: q("#regpassword"),
	signup_confirm: q("#regconfirm")
};

/**
 * A chunk of data. Use constructor.
 * @param String content - Contents of the data in HTML.
 * @param Integer reputation - Post reputation. Upvote increases it,
 * downvote decreases it. The higher the reputation, the more it gets
 * prioritized.
 * @param Array comments - A collection of 'Data' objects.
**/
function Data(content, reputation, tags, comments) {
	// Private.
	let properties = {
		content: content || "",
		reputation: reputation || 0,
		tags: tags || [],
		comments: comments || []
	};

	// Public.
	this.setContent = v => properties.content = v;
	this.addReputation = i => properties.reputation += i;
	this.addTags = v => properties.tags.push(v);
	this.addComment = v => properties.comments.push(v);

	this.getContent = v => properties.content;
	this.getReputation = v => properties.reputation;
	this.getTags = v => Object.assign([], properties.tags);
	this.getComments = v => Object.assign([], properties.comments);
}

/**
 * Create a card with the given label.
**/
function Card(img, label) {
	
}

document.addEventListener("beforeunload", event => {
	// Get rid of everything if the user doesn't want anything cached.
	if (!localStorage.lifespan)
		localStorage.clear();
});


// Init

{ // Profile view.
	// See if the user hasn't logged in yet.
	if (!sessionStorage.username || !sessionStorage.password) {
		// Show the login view.
		e.profile.innerHTML = '<input ' +
			'type=text id=username placeholder=Username>' +
			'<input type=password id=password placeholder=Password>' +
			'<a id=login class=btn>Login</a>';


		// Login.

		let login = _ => {
			let a = q(e.profile, "#username").value.toLowerCase(),
				b = q(e.profile, "#password").value;

			r({
				method: "POST",
				url: "login",
				headervalue: "application/json",
				data: '["' + a + '", "' + b + '"]'
			}, res => {
				if (res != -1) {
					res = JSON.parse(res);
					sessionStorage.username = res[1];
					sessionStorage.password = b;

					location.reload();
				}
			});
		};

		let keydown = event => (event.keyCode == 13 && login());

		q(e.profile, "#username").addEventListener("keydown", keydown);
		q(e.profile, "#password").addEventListener("keydown", keydown);
		q(e.profile, "#login").addEventListener("click", login);


		// Register.

		let register = _ => {
			if (e.signup_password.value != e.signup_confirm.value)
				return;

			let a = e.signup_username.value,
				b = e.signup_password.value;

			r({
				method: "POST",
				url: "register",
				headervalue: "application/json",
				data: '["' + a + '", "' + b + '"]'
			}, i => {
				if (i != -1) {
					sessionStorage.username = a;
					sessionStorage.password = b;

					location.reload();
				}
			});
		};

		keydown = event => (event.keyCode == 13 && register());

		e.signup_username.addEventListener("keydown", keydown);
		e.signup_password.addEventListener("keydown", keydown);
		e.signup_confirm.addEventListener("keydown", keydown);
		q(e.signup, "#register").addEventListener("click", register);
	} else r({ // See if the user's credentials are legitimate.
		method: "POST",
		url: "login",
		headervalue: "application/json",
		data: '["' + sessionStorage.username +
			'", "' + sessionStorage.password +
			'"]'
	}, i => {
		if (i != -1) {
			// Successfully retrieved ID.
			e.profile.innerHTML = '<img ' +
				'id=profilepicture src=dat/avatar/' + i + '.jpg>' +
				'<label id=profilename>' +
				sessionStorage.username + '</label>' +
				'<a id=newpost class=btn>Post</a>' +
				'<a id=myposts class=btn href="">My Posts</a>' +
				'<a id=myaccount class=btn href="">My Account</a>' +
				'<a id=logout class=btn href="">Logout</a>';

			q(e.profile, "#logout").addEventListener("click", _ => {
				// Clear everything when the user logs out.
				sessionStorage.removeItem("username");
				sessionStorage.removeItem("password");

				location.reload();
			});

			// Hide register view.
			e.signup.style.display = "none";
			e.signup.style.pointerEvents = "none";
		} else {
			// Something went wrong.
			sessionStorage.removeItem("username");
			sessionStorage.removeItem("password");

			location.reload();
		}
	});
}