# @jvdneut/xml-parser

Simple and lenient XML parser.

Parses into a generic (React-like) structure:

```
{
	name: "elementName",
	attributes: {},
	children: []
}
```

To use, install using `npm install @jvdneut/xml-parser`

```
const parse = require('@jvdneut/xml-parser');

const s = '<root attribute="value">text</root>';
// parse with relevant whitespace
const parsed = parse(s);

// parse ignoring whitespace
const parsedIgnoreWhitespace = parse(s, true);
```
