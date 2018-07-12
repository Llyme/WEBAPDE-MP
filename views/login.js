const e = {
	profile: q("#profile")
};


// Init
q("#profile #logout").addEventListener("click", _ => {
	console.log("ok...")
	// Clear everything when the user logs out.
	r({
		method: "POST",
		url: "logout",
		data: []
	}, _ => {
		location.reload();
	});
});