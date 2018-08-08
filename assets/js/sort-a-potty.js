/**
 * Binary insertion algorithm.
 * 'Lowest to highest' by default.
**/

module.exports = {
	/**
	 * Insert the given element in an orderly fashion.
	 * The 'list' is assumed to be sorted already.
	 * The index of where the value was inserted is returned.
	**/
	insert: {
		binary: (list, v, filter, flip) => {
			flip = flip ? 0 : 1;
			filter = filter ? filter : v => v;

			let cache = [];
			let pos = 0,
				len = list.length,
				b = filter(v);
			let cond = flip ?
				a => a < b :
				a => a > b;

			while (len > 1) {
				let y = Math.floor(len/2);
				let x = pos + y;

				if (cache[x] == null)
					cache[x] = [filter(list[x])];

				let a = cache[x][0];

				if (a == b) {
					x += flip;

					list.splice(x, 0, v);

					return x;
				} else if (cond(a))
					pos = x + 1;

				len = y;
			}

			pos += flip;

			list.splice(pos, 0, v);

			return pos;
		}
	}
};