// Export types
export type {
	XmlNode,
	XmlChild,
	XmlAttributes,
	ParseOptions,
	AttributeOptions,
} from './types.js';

// Export parser functions
export {
	parser,
	parseJsx,
	tokenize,
	parseTokens,
	buildHierarchy,
	stripWhitespace,
	getAttributes,
	replaceEntity,
	replaceEntities,
} from './xmlParser.js';

// Default export
export { default } from './xmlParser.js';
