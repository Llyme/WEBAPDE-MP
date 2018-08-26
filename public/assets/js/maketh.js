/**
 * CSS styler.
**/

const maketh = (e, props) => {
	if (typeof(props) == "string")
		if (maketh.style[props])
			props = maketh.style[props];

	if (!props) return {
		hover: props2 => {
			if (typeof(props2) == "string")
				props2 = maketh.style[props2];

			let def = {};

			for (let k in props2)
				def[k] = e.style[k];

			e.addEventListener("mouseenter", _ => {
				for (let k in props2)
					e.style[k] = props2[k];

			});

			e.addEventListener("mouseleave", _ => {
				for (let k in props2)
					e.style[k] = def[k];
			});
		},
		active: props2 => {
			if (typeof(props2) == "string")
				props2 = maketh.style[props2];

			let def = {};

			for (let k in props2)
				def[k] = e.style[k];

			let active;

			e.addEventListener("mousedown", _ => {
				active = 1;

				for (let k in props2)
					e.style[k] = props2[k];
			});

			document.addEventListener("mouseup", _ => {
				active = 0;

				for (let k in props2)
					e.style[k] = def[k];
			});

			e.addEventListener("mouseenter", _ => {
				if (!active)
					return;

				for (let k in props2)
					e.style[k] = props2[k];
			});

			e.addEventListener("mouseleave", _ => {
				if (!active)
					return;

				for (let k in props2)
					e.style[k] = def[k];
			});
		}
	};

	for (let k in props)
		e.style[k] = props[k];

	return e;
};

maketh.style = {};

maketh.struct = (name, props, inherit) => {
	if (inherit) (
		typeof(inherit) == "string" ? (
			maketh.style[inherit] &&
			Object.assign(props, maketh.style[inherit])
		) : inherit.map(k =>
			maketh.style[k] && Object.assign(props, maketh.style[k])
		)
	);

	maketh.style[name] = props;
};
