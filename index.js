e = {
	login: q("#login")
}

function Card(title, src, lnk) {
	let a = q("!a");
	a.className = "card";

	a.setAttribute("href", lnk);

	a.addEventListener("click", event => {
		event.stopPropagation();
		event.preventDefault();

		info_preview.src = src;

		comment.removeAttribute("invisible");
	});

	let label = q("!label");
	label.innerHTML = title;

	let img = q("!img");
	img.src = src;

	img.setAttribute("draggable", false);

	a.appendChild(label);
	a.appendChild(img);
	deck.appendChild(a);
}

// Hide window when clicking outside.
comment.addEventListener("click", event => (
	event.target == comment && comment.setAttribute("invisible", 1)
));

{
	let l = [[
		"The big brown fox jumps over the lazy dog. The big brown fox jumps over the lazy dog.",
		"https://scontent.fmnl4-2.fna.fbcdn.net/v/t1.0-9/34985071_1105616082955769_7177104125023223808_n.jpg?_nc_cat=0&oh=81db92499bfb8089c88ea981f423e714&oe=5BDA23E5"
	], [
		"Hello Man",
		"https://i.redd.it/qk0ke7mci2c11.jpg"
	], [
		"Sad Memes",
		"https://scontent.fmnl4-2.fna.fbcdn.net/v/t1.0-9/36692128_193090664664977_726496007335968768_n.jpg?_nc_cat=0&oh=5d1d36590a31bcd7e4c2da0d5a207a4a&oe=5BD14E2D"
	], [
		"Me",
		"https://scontent.fmnl4-2.fna.fbcdn.net/v/t1.0-9/36560238_2391013394276780_5377410659317186560_o.jpg?_nc_cat=0&oh=373f5488be73f631ac3f01f240a2badf&oe=5BA3B607"
	], [
		"Coolest PM",
		"https://scontent.fmnl4-2.fna.fbcdn.net/v/t1.0-9/36707700_465473153880547_3454880454635683840_n.jpg?_nc_cat=0&oh=ddbd0b917ad1d8a86786dc016b6dc6bf&oe=5BA3051F"
	], [
		"Class Contribution",
		"https://scontent.fmnl4-2.fna.fbcdn.net/v/t1.0-9/29244699_202151037046954_5264677942574710784_n.jpg?_nc_cat=0&oh=08ce3252b7d23578afe26994de2c5716&oe=5BA60C85"
	], [
		"Younger siblings are slaves",
		"https://scontent.fmnl4-2.fna.fbcdn.net/v/t1.0-9/36263191_1775932565834959_7871936907603607552_n.jpg?_nc_cat=0&oh=71e9726c194dc66f5860919f0e85ebc1&oe=5BD2A1F0"
	]]

	for (let i in l) Card(
		l[i][0],
		l[i][1]
	);
}
