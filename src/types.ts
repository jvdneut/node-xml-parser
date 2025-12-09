/**
 * Represents the attributes of an XML/JSX element as key-value pairs
 */
export interface XmlAttributes {
	[key: string]: string | boolean | number | object | unknown;
}

/**
 * Represents an XML/JSX element node in the parsed tree
 */
export interface XmlNode {
	/** The tag name of the element */
	name: string;
	/** The attributes of the element */
	attributes: XmlAttributes;
	/** The children of the element (can be other nodes or text strings) */
	children: XmlChild[];
}

/**
 * A child can be either a text string or another XML node
 */
export type XmlChild = string | XmlNode;

/**
 * Options for parsing XML/JSX
 */
export interface ParseOptions {
	/** Enable JSX-style attribute parsing */
	jsx?: boolean;
	/** Map of tag names that should be treated as self-closing */
	selfClosing?: Record<string, boolean>;
}

/**
 * Options for attribute parsing
 */
export interface AttributeOptions {
	/** Enable JSX-style attribute parsing */
	jsx?: boolean;
}

/**
 * Internal root structure used during parsing
 */
export interface ParserRoot {
	children: XmlChild[];
}
