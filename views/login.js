// Logout

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


// Upload

let image_type = [
	"image/png",
	"image/gif",
	"image/bmp",
	"image/jpeg",
	"image/jpg"
];

function upload_check(event) {
	let file = event.dataTransfer ?
		event.dataTransfer.files[0] : event.target.files[0];

	if (file && image_type.includes(file.type)) {
		let reader = new FileReader();

		reader.onload = event => {
			q("#upload_img").src = event.target.result;
		};

		reader.readAsDataURL(file);

		q("#upload_caption").value = "";
		q("#upload").removeAttribute("hidden");
	}
}

q("#upload_post").addEventListener("click", _ =>
	// Do nothing, for now.
	q("#upload").setAttribute("hidden", 1)
);

q("#upload_cancel").addEventListener("click", _ =>
	q("#upload").setAttribute("hidden", 1)
);

q("#upload_file").addEventListener("change", upload_check);

q("header div .up_btn")[0].addEventListener("click", _ => 
	q("#upload_file").click()
);

document.addEventListener("drop", event => {
	event.stopPropagation();
	event.preventDefault();
	upload_check(event);
});

document.addEventListener("dragover", event => {
	event.stopPropagation();
	event.preventDefault();
	event.dataTransfer.dropEffect = "copy";
});