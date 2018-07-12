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
let login = _ => {
	let a = q("#profile #username").value.toLowerCase(),
		b = q("#profile #password").value;

	r({
		method: "POST",
		url: "login",
		data: [a, b]
	}, _ =>
		location.reload()
	);
};

let keydown = event => (event.keyCode == 13 && login());

q("#profile #username").addEventListener("keydown", keydown);
q("#profile #password").addEventListener("keydown", keydown);
q("#profile #login").addEventListener("click", login);


// Register.

let register = _ => {
	let a = e.signup_username.value,
		b = e.signup_password.value,
		c = e.signup_confirm.value;

	if (b != c) return;

	r({
		method: "POST",
		url: "register",
		data: [a, b]
	}, _ => {
		location.reload()
	});
};

keydown = event => (event.keyCode == 13 && register());

e.signup_username.addEventListener("keydown", keydown);
e.signup_password.addEventListener("keydown", keydown);
e.signup_confirm.addEventListener("keydown", keydown);
q("#signup #register").addEventListener("click", register);
