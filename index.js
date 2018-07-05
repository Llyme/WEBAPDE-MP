/**
 * A chunk of data. Use constructor.
 * @param String content - Contents of the data in HTML.
 * @param Integer reputation - Post reputation. Upvote increases it, downvote
 * decreases it. The higher the reputation, the more it gets prioritized.
 * @param Array comments - A collection of 'Data' objects.
**/
function Data(content, reputation, comments) {
	// Private.
	let properties = {
		content: content || "",
		reputation: reputation || 0,
		comments: comments || []
	};

	// Public.
	this.setContent = v => properties.content = v;
	this.addReputation = i => properties.reputation += i;
	this.addComment = data => properties.comments.push(data);

	this.getContent = v => properties.content;
	this.getReputation = v => properties.reputation;
	this.getComments = v => Object.assign([], properties.comments);
}

console.log(new Data())

/**
 * Create a card with the given label.
**/
function Card(img, label) {
	
}