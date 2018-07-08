const fs = require("fs");
const path = require("path");
const atob = require("atob");
const btoa = require("btoa");

let data = {
	UID: 0,
	size: 0
};

function database(filepath) {
	let data;

	try {
		data = JSON.parse(fs.readFileSync(filepath));
	} catch(err) {
		data = {
			UID: 0,
			size: 0
		};
	}

	/**
	 * Add new element in the database.
	**/
	this.add = v => {
		if (data.reserve && data.reserve.length)
			data[data.reserve.pop()] = v;
		else {
			let id = data.UID;
			data[id] = v;
			data.UID++;
			data.size++;

			return id;
		}
	};

	/**
	 * Set an existing data's value.
	**/
	this.set = (i, v) => {
		if (data[i] == undefined)
			return;

		data[i] = v;
	};

	/**
	 * Return the stored data with the given ID.
	**/
	this.get = i => data[i];

	this.rem = i => {
		if (data[i] == undefined)
			return;

		if (!data.reserve)
			data.reserve = [];

		data.reserve.push(i);
		data.size--;
	};

	/**
	 * Returns the total number of elements in the database.
	**/
	this.size = _ => data.size;

	/**
	 * Return all of the indices or until 'len' with the same value.
	 * @param Value val - The value to the searched.
	 * @param Function iterator - Used to modify on how the iterator
	 * checks the value.
	**/
	this.find = (val, iterator, len) => {
		let res = [];
		iterator = iterator ? iterator : v => v;
		len = len ? len : -1;

		for (let i = 0; i < data.UID && len; i++)
			if (data[i] != undefined && iterator(data[i]) === val) {
				res.push(i);
				len--;
			}

		return res;
	}

	/**
	 * Save the data.
	**/
	this.save = _ => {
		let l = filepath.split("/");
		let dir = "";

		for (let i = 0; i < l.length - 1; i++) {
			dir += l[i] + "/";

			if (!fs.existsSync(dir))
				fs.mkdirSync(dir);
		}

		fs.writeFileSync(filepath, JSON.stringify(data));
	};
}

module.exports = v => new database(v);