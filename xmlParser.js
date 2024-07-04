const not =
	fn =>
	(...args) =>
		!fn(...args);
const isNull = x => x === null;

const reTokens = /<!\[CDATA\[[\S\s]*?\]\]>|[^<>]+|<[^<>]+>/g;

const reIsTag = /^<[^<>]+>$/;
const reSelfClosingTag = /\/>$/;
const reClosingTag = /^<\//;

const reIsCData = /^<!\[CDATA\[([\S\s]*?)\]\]>$/;
const reElementAttributes = /<\/?(\S+)([^<>]*?)\/?>/i;
const reIsWhiteSpace = /^\s*$/;

const getCharCode = entity => {
	if (entity[0] === 'x') {
		return parseInt(entity.substr(1), 16);
	}
	return parseInt(entity, 10);
};
export const replaceEntity = entity => {
	switch (entity[1]) {
		case '#': {
			const charCode = getCharCode(entity.substr(2));
			return String.fromCharCode(charCode);
		}
		default:
			switch (entity) {
				case '&lt;':
					return '<';
				case '&gt;':
					return '>';
				case '&apos;':
					return "'";
				case '&quot;':
					return '"';
				case '&nbsp;':
					return '\xa0';
				default:
					return entity;
			}
	}
};

export const replaceEntities = s => s.replace(/&[^;]+;/g, replaceEntity);

export const getAttributes = (s, { jsx = false } = {}) => {
	const reAttributes = jsx
		? /\s+([a-z:_]+(={[^}]+[}]+|'[^']+'|="[^"]+"|(?=\s+|$)))/gi
		: /\s+([a-z:_]+(="[^"]+"))/gi;
	const matches = s.match(reAttributes) || [];
	return matches.reduce((result, attribute) => {
		let [key, value] = attribute.split('=');
		key = key.trim();
		if (!key) {
			// ignore
		} else if (typeof value === 'undefined') {
			result[key] = true;
		} else {
			result[key] = replaceEntities(value.substring(1, value.length - 1));
		}
		return result;
	}, {});
};

const getElement = (s, options) => {
	const [_, name, sAttributes] = reElementAttributes.exec(s);
	const attributes = getAttributes(sAttributes, options);

	return {
		name,
		attributes,
		children: [],
	};
};

export const tokenize = xml => xml.match(reTokens);

export const buildHierarchy = (tokens, parents, options = {}) =>
	tokens.forEach(token => {
		const parent = parents[parents.length - 1];

		if (reIsCData.test(token)) {
			// treat as text
			const text = reIsCData.exec(token)[1];
			parent.children.push(text);
		} else if (reIsTag.test(token)) {
			if (reClosingTag.test(token)) {
				// close current
				parents.pop();
			} else if (/<\?xml/.test(token)) {
				// ignore
			} else if (/<!--/.test(token)) {
				// ignore
			} else if (reSelfClosingTag.test(token)) {
				// create and move on
				const tag = getElement(token, options);
				parent.children.push(tag);
			} else {
				// create and make new parent
				const tag = getElement(token, options);
				parent.children.push(tag);
				parents.push(tag);
			}
		} else {
			parent.children.push(replaceEntities(token));
		}
	});

export const parseTokens = (tokens, options) => {
	const root = { children: [] };
	const parents = [root];

	buildHierarchy(tokens, parents, options);

	return root.children;
};

export const stripWhitespace = node => {
	if (typeof node === 'string' && reIsWhiteSpace.test(node)) {
		return null;
	} else if (node.children) {
		return {
			...node,
			children: node.children.map(stripWhitespace).filter(not(isNull)),
		};
	}

	return node;
};

export const parser = (xml, ignoreWhitespace = false, options = {}) => {
	const tokens = tokenize(xml);
	const parsed = parseTokens(tokens, options);
	if (ignoreWhitespace) {
		return parsed.map(stripWhitespace).filter(not(isNull));
	}
	return parsed;
};

export const parseJsx = (xml, ignoreWhitespace = false) =>
	parser(xml, ignoreWhitespace, { jsx: true });

export default parser;
