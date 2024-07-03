import { describe, test, expect } from 'vitest';
import parse, {
	tokenize,
	parseTokens,
	replaceEntity,
	replaceEntities,
	getAttributes,
	parseJsx,
} from './xmlParser';

describe('attributeParser', () => {
	test('Parses ` className="classy"` correctly', () => {
		const input = ' className="classy"';
		const expected = { className: 'classy' };
		const actual = getAttributes(input);

		expect(actual).toEqual(expected);
	});
	test('Parses ` prop={`hello`}` correctly', () => {
		const input = ' prop={`hello`}';
		const expected = { prop: '`hello`' };
		const actual = getAttributes(input, { jsx: true });

		expect(actual).toEqual(expected);
	});

	test('Parses ` prop={`hello`} other={{ prop: "value" }} hasSomething className="classy"` correctly', () => {
		const input =
			' prop={`hello`} other={{ prop: "value" }} hasSomething className="classy"';
		const expected = {
			prop: '`hello`',
			other: `{ prop: "value" }`,
			hasSomething: true,
			className: 'classy',
		};
		const actual = getAttributes(input, { jsx: true });

		expect(actual).toEqual(expected);
	});
});
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

	test('Tokenizes `<Component prop={`hello`}>text</Component>` correctly', () => {
		const input = '<Component prop={`hello`}>text</Component>';
		const expected = ['<Component prop={`hello`}>', 'text', '</Component>'];
		const actual = tokenize(input);

		expect(actual).toEqual(expected);
	});

	test('Tokenizes `<Component prop={`hello`} hasSomething className="classy">text</Component>` correctly', () => {
		const input =
			'<Component prop={`hello`} hasSomething className="classy">text</Component>';
		const expected = [
			'<Component prop={`hello`} hasSomething className="classy">',
			'text',
			'</Component>',
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

	test('Parses `<Component prop={`hello`} hasSomething className="classy">text</Component>` correctly', () => {
		const tokens = [
			'<Component prop={`hello`} other={{ prop: "value" }} hasSomething className="classy">',
			'text',
			'</Component>',
		];
		const expected = [
			{
				name: 'Component',
				attributes: {
					prop: '`hello`',
					other: '{ prop: "value" }',
					hasSomething: true,
					className: 'classy',
				},
				children: ['text'],
			},
		];
		const actual = parseTokens(tokens, { jsx: true });

		expect(actual).toEqual(expected);
	});

	test.only('Parses JSX correctly', () => {
		const s = `<RelatedCard title="Hoe help je de leerling bij goed onderzoek naar de juiste studiekeuze?" more_text="Lees meer over LOB.online." link="/onderwijs/lob-loopbaanleren" src="~/boy-with-headphones-regular.jpeg" />`;
		const expected = [
			{
				name: 'Component',
				attributes: {
					prop: '`hello`',
					other: '{ prop: "value" }',
					hasSomething: true,
					className: 'classy',
				},
				children: ['text'],
			},
		];
		const actual = parseJsx(s)

		console.log(actual);
		//expect(actual).toEqual(expected);
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

describe('Parse', () => {
	test('Namespace prefixes should be handled as other nodes', () => {
		const input =
			'<ac:link><ri:attachment ri:filename="Interne audit ISO 27001 AMN 5 juni 2019.xlsx" /><ac:plain-text-link-body><![CDATA[Externe audit ISO 27002 AMN 6 juni 2019]]></ac:plain-text-link-body></ac:link>';
		const actual = parse(input);
		const expected = [
			{
				attributes: {},
				children: [
					{
						attributes: {
							'ri:filename': 'Interne audit ISO 27001 AMN 5 juni 2019.xlsx',
						},
						children: [],
						name: 'ri:attachment',
					},
					{
						attributes: {},
						children: ['Externe audit ISO 27002 AMN 6 juni 2019'],
						name: 'ac:plain-text-link-body',
					},
				],
				name: 'ac:link',
			},
		];

		expect(actual).toEqual(expected);
	});
});
