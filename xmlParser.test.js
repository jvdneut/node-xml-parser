const parse = require('./xmlParser');
const {
	tokenize,
	parseTokens,
	replaceEntity,
	replaceEntities,
} = require('./xmlParser');

describe('(internal) Tokenizer', () => {
	test('Tokenizes `<br />` correctly', () => {
		const input = '<br />';
		const expected = ['<br />'];
		const actual = tokenize(input);

		expect(actual).toEqual(expected);
	});

	test('Tokenizes `hello<br />world` correctly', () => {
		const input = 'hello<br />world';
		const expected = ['hello', '<br />', 'world'];
		const actual = tokenize(input);

		expect(actual).toEqual(expected);
	});

	test('Tokenizes `<span class="outer"><span class="inner">hello<br />world</span></span>` correctly', () => {
		const input =
			'<span class="outer"><span class="inner">hello<br />world</span></span>';
		const expected = [
			'<span class="outer">',
			'<span class="inner">',
			'hello',
			'<br />',
			'world',
			'</span>',
			'</span>',
		];
		const actual = tokenize(input);

		expect(actual).toEqual(expected);
	});
});

describe('(internal) tokenParser', () => {
	test('Parses a `<br />` correctly', () => {
		const tokens = ['<br />'];
		const expected = [
			{
				name: 'br',
				attributes: {},
				children: [],
			},
		];
		const actual = parseTokens(tokens);

		expect(actual).toEqual(expected);
	});

	test('Parses a `hello<br />world` correctly', () => {
		const tokens = ['hello', '<br />', 'world'];
		const expected = [
			'hello',
			{
				name: 'br',
				attributes: {},
				children: [],
			},
			'world',
		];
		const actual = parseTokens(tokens);

		expect(actual).toEqual(expected);
	});

	test('Parses a `<span class="outer"><span class="inner">hello<br />world</span></span>` correctly', () => {
		const tokens = [
			'<span class="outer">',
			'<span class="inner">',
			'hello',
			'<br />',
			'world',
			'</span>',
			'</span>',
		];
		const expected = [
			{
				name: 'span',
				attributes: { class: 'outer' },
				children: [
					{
						name: 'span',
						attributes: { class: 'inner' },
						children: [
							'hello',
							{
								name: 'br',
								attributes: {},
								children: [],
							},
							'world',
						],
					},
				],
			},
		];
		const actual = parseTokens(tokens);

		expect(actual).toEqual(expected);
	});
});

describe('Parser', () => {
	test('Parses a `<br />` correctly', () => {
		const input = '<br />';
		const expected = [
			{
				name: 'br',
				attributes: {},
				children: [],
			},
		];
		const actual = parse(input);

		expect(actual).toEqual(expected);
	});

	test('Parses a `hello<br />world` correctly', () => {
		const input = 'hello<br />world';
		const expected = [
			'hello',
			{
				name: 'br',
				attributes: {},
				children: [],
			},
			'world',
		];
		const actual = parse(input);

		expect(actual).toEqual(expected);
	});

	test('Parses a `<span class="outer"><span class="inner">hello<br />world</span></span>` correctly', () => {
		const input =
			'<span class="outer"><span class="inner">hello<br />world</span></span>';
		const expected = [
			{
				name: 'span',
				attributes: { class: 'outer' },
				children: [
					{
						name: 'span',
						attributes: { class: 'inner' },
						children: [
							'hello',
							{
								name: 'br',
								attributes: {},
								children: [],
							},
							'world',
						],
					},
				],
			},
		];
		const actual = parse(input);

		expect(actual).toEqual(expected);
	});
});

describe('Entity replacement', () => {
	test('&#160; should create a non-breaking space', () => {
		const input = '&#160;';
		const actual = replaceEntity(input);
		const expected = String.fromCharCode(160);

		expect(actual).toBe(expected);
	});

	test('&#x03B8; should create a theta', () => {
		const input = '&#x03B8;';
		const actual = replaceEntity(input);
		const expected = String.fromCharCode(952);

		expect(actual).toBe(expected);
	});

	test('&lt; should create a <', () => {
		const input = '&lt;';
		const actual = replaceEntity(input);
		const expected = '<';

		expect(actual).toBe(expected);
	});

	test('&gt; should create a >', () => {
		const input = '&gt;';
		const actual = replaceEntity(input);
		const expected = '>';

		expect(actual).toBe(expected);
	});

	test("&apos; should create a '", () => {
		const input = '&apos;';
		const actual = replaceEntity(input);
		const expected = "'";

		expect(actual).toBe(expected);
	});

	test('&quot; should create a "', () => {
		const input = '&quot;';
		const actual = replaceEntity(input);
		const expected = '"';

		expect(actual).toBe(expected);
	});

	test('&nbsp; should create a non-breaking space', () => {
		const input = '&nbsp;';
		const actual = replaceEntity(input);
		const expected = String.fromCharCode(160);

		expect(actual).toBe(expected);
	});
});

describe('Entities replacement', () => {
	test("'&#160;&lt;&x03B8;' should create correct string", () => {
		const input = '&#160;&lt;&#x03B8;';
		const actual = replaceEntities(input);
		const expected = '\xa0<\u03b8';

		expect(actual).toBe(expected);
	});
});
