import type {
	XmlNode,
	XmlChild,
	ParseOptions,
	AttributeOptions,
	XmlAttributes,
	ParserRoot,
} from './types.js';

const not =
	<T extends unknown[]>(fn: (...args: T) => boolean) =>
	(...args: T): boolean =>
		!fn(...args);

const isNull = (x: unknown): x is null => x === null;

const isNotNull = <T>(x: T | null): x is T => x !== null;

const reTokens = /<!\[CDATA\[[\S\s]*?\]\]>|[^<>]+|<[^<>]+>|[<>]/g;

const reIsTag = /^<[^<>]+>$/;
const reSelfClosingTag = /\/>$/;
const reClosingTag = /^<\//;

const reIsCData = /^<!\[CDATA\[([\S\s]*?)\]\]>$/;
const reElementAttributes = /<\/?(\S+)([^<>]*?)\/?>/i;
const reIsWhiteSpace = /^\s*$/;

const getCharCode = (entity: string): number => {
	if (entity[0] === 'x') {
		return parseInt(entity.substr(1), 16);
	}
	return parseInt(entity, 10);
};

/**
 * Replaces a single XML entity with its corresponding character
 * @param entity - The entity string (e.g., "&amp;", "&#160;", "&#x03B8;")
 * @returns The decoded character or the original entity if unknown
 */
export const replaceEntity = (entity: string): string => {
	switch (entity[1]) {
		case '#': {
			const charCode = getCharCode(entity.substr(2));
			return String.fromCharCode(charCode);
		}
		default:
			switch (entity) {
				case '&amp;':
					return '&';
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

/**
 * Replaces all XML entities in a string with their corresponding characters
 * @param s - The input string containing entities
 * @returns The string with all entities replaced
 */
export const replaceEntities = (s: string): string =>
	s.replace(/&[^;]+;/g, replaceEntity);

/**
 * Parses attributes from an XML/JSX element string
 * @param s - The attribute string to parse
 * @param options - Parsing options (jsx mode, etc.)
 * @returns An object containing the parsed attributes
 */
export const getAttributes = (
	s: string,
	{ jsx = false }: AttributeOptions = {},
): XmlAttributes => {
	const reAttributes = jsx
		? /\s+([a-z:_-]+(={[^}]+[}]+|'[^']+'|="[^"]+"|(?=\s+|$)))/gi
		: /\s+([a-z:_-]+(="[^"]+"))/gi;
	const matches = s.match(reAttributes) || [];
	return matches.reduce((result, attribute) => {
		let [key, value] = attribute.split(/=([\S\s]+)/);
		key = key.trim();
		if (!key) {
			// ignore
		} else if (typeof value === 'undefined') {
			result[key] = true;
		} else if (value[0] === '{') {
			value = value.substring(1, value.length - 1);
			value = value.replace(/,(\s*[\]\}])/g, '$1');
			value = value.replace(
				/(['`])(.+?)\1/g,
				(_, quote, s) => `"${s.replace(/"/g, '\\"')}"`,
			);
			value = value.replace(/([a-z_0-9]+):/gi, '"$1":');
			try {
				result[key] = JSON.parse(value) as unknown;
			} catch (e) {
				// If parsing fails, store the original value
				result[key] = value;
			}
		} else {
			result[key] = replaceEntities(value.substring(1, value.length - 1));
		}
		return result;
	}, {} as XmlAttributes);
};

const getElement = (s: string, options: ParseOptions): XmlNode => {
	const match = reElementAttributes.exec(s);
	if (!match) {
		throw new Error(`Invalid element: ${s}`);
	}
	const [_, name, sAttributes] = match;
	const attributes = getAttributes(sAttributes, options);

	return {
		name,
		attributes,
		children: [],
	};
};

/**
 * Tokenizes an XML/JSX string into an array of tokens
 * @param xml - The XML/JSX string to tokenize
 * @returns An array of token strings
 */
export const tokenize = (xml: string): string[] => {
	const tokens = xml.match(reTokens);
	return tokens || [];
};

/**
 * Builds a hierarchical structure from tokens
 * @param tokens - Array of token strings
 * @param parents - Stack of parent nodes
 * @param options - Parsing options
 */
export const buildHierarchy = (
	tokens: string[],
	parents: (ParserRoot | XmlNode)[],
	options: ParseOptions = {},
): void => {
	tokens.forEach(token => {
		const parent = parents[parents.length - 1];
		if (!parent) {
			throw new Error('No parent node available');
		}

		if (reIsCData.test(token)) {
			// treat as text
			const match = reIsCData.exec(token);
			const text = match?.[1] || '';
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
				if (!options.selfClosing || !options.selfClosing[tag.name]) {
					parents.push(tag);
				}
			}
		} else {
			if (
				parent.children.length === 1 &&
				typeof parent.children[0] === 'string'
			) {
				parent.children = [`${parent.children[0]}${replaceEntities(token)}`];
			} else {
				parent.children.push(replaceEntities(token));
			}
		}
	});
};

/**
 * Parses tokens into a hierarchical structure
 * @param tokens - Array of token strings
 * @param options - Parsing options
 * @returns An array of parsed XML nodes and text
 */
export const parseTokens = (
	tokens: string[],
	options: ParseOptions = {},
): XmlChild[] => {
	const root: ParserRoot = { children: [] };
	const parents: (ParserRoot | XmlNode)[] = [root];

	buildHierarchy(tokens, parents, options);

	return root.children;
};

/**
 * Strips whitespace-only text nodes from the tree
 * @param node - A node or text string to process
 * @returns The node with whitespace stripped, or null if the node was whitespace
 */
export const stripWhitespace = (node: XmlChild): XmlChild | null => {
	if (typeof node === 'string' && reIsWhiteSpace.test(node)) {
		return null;
	} else if (typeof node === 'object' && 'children' in node) {
		return {
			...node,
			children: node.children.map(stripWhitespace).filter(isNotNull),
		};
	}

	return node;
};

/**
 * Parses an XML/JSX string into a hierarchical structure
 * @param xml - The XML/JSX string to parse
 * @param ignoreWhitespace - Whether to strip whitespace-only text nodes
 * @param options - Parsing options (jsx mode, selfClosing tags, etc.)
 * @returns An array of parsed nodes and text
 */
export const parser = (
	xml: string,
	ignoreWhitespace = false,
	options: ParseOptions = {},
): XmlChild[] => {
	const tokens = tokenize(xml);
	const parsed = parseTokens(tokens, options);
	if (ignoreWhitespace) {
		return parsed.map(stripWhitespace).filter(isNotNull);
	}
	return parsed;
};

/**
 * Parses a JSX string into a hierarchical structure
 * @param xml - The JSX string to parse
 * @param ignoreWhitespace - Whether to strip whitespace-only text nodes
 * @returns An array of parsed nodes and text
 */
export const parseJsx = (xml: string, ignoreWhitespace = false): XmlChild[] =>
	parser(xml, ignoreWhitespace, { jsx: true });

export default parser;
