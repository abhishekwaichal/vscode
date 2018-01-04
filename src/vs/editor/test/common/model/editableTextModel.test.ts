/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import { Range } from 'vs/editor/common/core/range';
import { EndOfLineSequence, IIdentifiedSingleEditOperation, DefaultEndOfLine } from 'vs/editor/common/model';
import { TextModel } from 'vs/editor/common/model/textModel';
import { MirrorModel } from 'vs/editor/common/model/mirrorModel';
import { assertSyncedModels, testApplyEditsWithSyncedModels } from 'vs/editor/test/common/model/editableTextModelTestUtils';
import { IModelContentChangedEvent } from 'vs/editor/common/model/textModelEvents';
import { RawTextSource, TextSource } from 'vs/editor/common/model/textSource';
import { TextBuffer, IValidatedEditOperation } from 'vs/editor/common/model/textBuffer';

function createEditableTextModelFromString(text: string): TextModel {
	return new TextModel(RawTextSource.fromString(text), TextModel.DEFAULT_CREATION_OPTIONS, null);
}

suite('EditorModel - EditableTextModel._getInverseEdits', () => {

	function editOp(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number, text: string[]): IValidatedEditOperation {
		return {
			sortIndex: 0,
			identifier: null,
			range: new Range(startLineNumber, startColumn, endLineNumber, endColumn),
			rangeOffset: 0,
			rangeLength: 0,
			lines: text,
			forceMoveMarkers: false,
			isAutoWhitespaceEdit: false
		};
	}

	function inverseEditOp(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number): Range {
		return new Range(startLineNumber, startColumn, endLineNumber, endColumn);
	}

	function assertInverseEdits(ops: IValidatedEditOperation[], expected: Range[]): void {
		var actual = TextBuffer._getInverseEditRanges(ops);
		assert.deepEqual(actual, expected);
	}

	test('single insert', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 1, ['hello'])
			],
			[
				inverseEditOp(1, 1, 1, 6)
			]
		);
	});

	test('Bug 19872: Undo is funky', () => {
		assertInverseEdits(
			[
				editOp(2, 1, 2, 2, ['']),
				editOp(3, 1, 4, 2, [''])
			],
			[
				inverseEditOp(2, 1, 2, 1),
				inverseEditOp(3, 1, 3, 1)
			]
		);
	});

	test('two single unrelated inserts', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 1, ['hello']),
				editOp(2, 1, 2, 1, ['world'])
			],
			[
				inverseEditOp(1, 1, 1, 6),
				inverseEditOp(2, 1, 2, 6)
			]
		);
	});

	test('two single inserts 1', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 1, ['hello']),
				editOp(1, 2, 1, 2, ['world'])
			],
			[
				inverseEditOp(1, 1, 1, 6),
				inverseEditOp(1, 7, 1, 12)
			]
		);
	});

	test('two single inserts 2', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 1, ['hello']),
				editOp(1, 4, 1, 4, ['world'])
			],
			[
				inverseEditOp(1, 1, 1, 6),
				inverseEditOp(1, 9, 1, 14)
			]
		);
	});

	test('multiline insert', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 1, ['hello', 'world'])
			],
			[
				inverseEditOp(1, 1, 2, 6)
			]
		);
	});

	test('two unrelated multiline inserts', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 1, ['hello', 'world']),
				editOp(2, 1, 2, 1, ['how', 'are', 'you?']),
			],
			[
				inverseEditOp(1, 1, 2, 6),
				inverseEditOp(3, 1, 5, 5),
			]
		);
	});

	test('two multiline inserts 1', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 1, ['hello', 'world']),
				editOp(1, 2, 1, 2, ['how', 'are', 'you?']),
			],
			[
				inverseEditOp(1, 1, 2, 6),
				inverseEditOp(2, 7, 4, 5),
			]
		);
	});

	test('single delete', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 6, null)
			],
			[
				inverseEditOp(1, 1, 1, 1)
			]
		);
	});

	test('two single unrelated deletes', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 6, null),
				editOp(2, 1, 2, 6, null)
			],
			[
				inverseEditOp(1, 1, 1, 1),
				inverseEditOp(2, 1, 2, 1)
			]
		);
	});

	test('two single deletes 1', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 6, null),
				editOp(1, 7, 1, 12, null)
			],
			[
				inverseEditOp(1, 1, 1, 1),
				inverseEditOp(1, 2, 1, 2)
			]
		);
	});

	test('two single deletes 2', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 6, null),
				editOp(1, 9, 1, 14, null)
			],
			[
				inverseEditOp(1, 1, 1, 1),
				inverseEditOp(1, 4, 1, 4)
			]
		);
	});

	test('multiline delete', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 2, 6, null)
			],
			[
				inverseEditOp(1, 1, 1, 1)
			]
		);
	});

	test('two unrelated multiline deletes', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 2, 6, null),
				editOp(3, 1, 5, 5, null),
			],
			[
				inverseEditOp(1, 1, 1, 1),
				inverseEditOp(2, 1, 2, 1),
			]
		);
	});

	test('two multiline deletes 1', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 2, 6, null),
				editOp(2, 7, 4, 5, null),
			],
			[
				inverseEditOp(1, 1, 1, 1),
				inverseEditOp(1, 2, 1, 2),
			]
		);
	});

	test('single replace', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 6, ['Hello world'])
			],
			[
				inverseEditOp(1, 1, 1, 12)
			]
		);
	});

	test('two replaces', () => {
		assertInverseEdits(
			[
				editOp(1, 1, 1, 6, ['Hello world']),
				editOp(1, 7, 1, 8, ['How are you?']),
			],
			[
				inverseEditOp(1, 1, 1, 12),
				inverseEditOp(1, 13, 1, 25)
			]
		);
	});

	test('many edits', () => {
		assertInverseEdits(
			[
				editOp(1, 2, 1, 2, ['', '  ']),
				editOp(1, 5, 1, 6, ['']),
				editOp(1, 9, 1, 9, ['', ''])
			],
			[
				inverseEditOp(1, 2, 2, 3),
				inverseEditOp(2, 6, 2, 6),
				inverseEditOp(2, 9, 3, 1)
			]
		);
	});
});

suite('EditorModel - EditableTextModel._toSingleEditOperation', () => {

	function editOp(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number, rangeOffset: number, rangeLength: number, text: string[]): IValidatedEditOperation {
		return {
			sortIndex: 0,
			identifier: null,
			range: new Range(startLineNumber, startColumn, endLineNumber, endColumn),
			rangeOffset: rangeOffset,
			rangeLength: rangeLength,
			lines: text,
			forceMoveMarkers: false,
			isAutoWhitespaceEdit: false
		};
	}

	function testSimpleApplyEdits(original: string[], edits: IValidatedEditOperation[], expected: IValidatedEditOperation): void {
		const textSource = TextSource.fromString(original.join('\n'), DefaultEndOfLine.LF);
		const textBuffer = new TextBuffer(textSource);

		const actual = textBuffer._toSingleEditOperation(edits);
		assert.deepEqual(actual, expected);
	}

	test('one edit op is unchanged', () => {
		testSimpleApplyEdits(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 3, 1, 3, 2, 0, [' new line', 'No longer'])
			],
			editOp(1, 3, 1, 3, 2, 0, [' new line', 'No longer'])
		);
	});

	test('two edits on one line', () => {
		testSimpleApplyEdits([
			'My First Line',
			'\t\tMy Second Line',
			'    Third Line',
			'',
			'1'
		], [
				editOp(1, 1, 1, 3, 0, 2, ['Your']),
				editOp(1, 4, 1, 4, 3, 0, ['Interesting ']),
				editOp(2, 3, 2, 6, 16, 3, null)
			],
			editOp(1, 1, 2, 6, 0, 19, [
				'Your Interesting First Line',
				'\t\t'
			]));
	});

	test('insert multiple newlines', () => {
		testSimpleApplyEdits(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 3, 1, 3, 2, 0, ['', '', '', '', '']),
				editOp(3, 15, 3, 15, 45, 0, ['a', 'b'])
			],
			editOp(1, 3, 3, 15, 2, 43, [
				'',
				'',
				'',
				'',
				' First Line',
				'\t\tMy Second Line',
				'    Third Linea',
				'b'
			])
		);
	});

	test('delete empty text', () => {
		testSimpleApplyEdits(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 1, 1, 0, 0, [''])
			],
			editOp(1, 1, 1, 1, 0, 0, [''])
		);
	});

	test('two unrelated edits', () => {
		testSimpleApplyEdits(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'123'
			],
			[
				editOp(2, 1, 2, 3, 14, 2, ['\t']),
				editOp(3, 1, 3, 5, 31, 4, [''])
			],
			editOp(2, 1, 3, 5, 14, 21, ['\tMy Second Line', ''])
		);
	});

	test('many edits', () => {
		testSimpleApplyEdits(
			[
				'{"x" : 1}'
			],
			[
				editOp(1, 2, 1, 2, 1, 0, ['\n  ']),
				editOp(1, 5, 1, 6, 4, 1, ['']),
				editOp(1, 9, 1, 9, 8, 0, ['\n'])
			],
			editOp(1, 2, 1, 9, 1, 7, [
				'',
				'  "x": 1',
				''
			])
		);
	});

	test('many edits reversed', () => {
		testSimpleApplyEdits(
			[
				'{',
				'  "x": 1',
				'}'
			],
			[
				editOp(1, 2, 2, 3, 1, 3, ['']),
				editOp(2, 6, 2, 6, 7, 0, [' ']),
				editOp(2, 9, 3, 1, 10, 1, [''])
			],
			editOp(1, 2, 3, 1, 1, 10, ['"x" : 1'])
		);
	});

	test('replacing newlines 1', () => {
		testSimpleApplyEdits(
			[
				'{',
				'"a": true,',
				'',
				'"b": true',
				'}'
			],
			[
				editOp(1, 2, 2, 1, 1, 1, ['', '\t']),
				editOp(2, 11, 4, 1, 12, 2, ['', '\t'])
			],
			editOp(1, 2, 4, 1, 1, 13, [
				'',
				'\t"a": true,',
				'\t'
			])
		);
	});

	test('replacing newlines 2', () => {
		testSimpleApplyEdits(
			[
				'some text',
				'some more text',
				'now comes an empty line',
				'',
				'after empty line',
				'and the last line'
			],
			[
				editOp(1, 5, 3, 1, 4, 21, [' text', 'some more text', 'some more text']),
				editOp(3, 2, 4, 1, 26, 23, ['o more lines', 'asd', 'asd', 'asd']),
				editOp(5, 1, 5, 6, 50, 5, ['zzzzzzzz']),
				editOp(5, 11, 6, 16, 60, 22, ['1', '2', '3', '4'])
			],
			editOp(1, 5, 6, 16, 4, 78, [
				' text',
				'some more text',
				'some more textno more lines',
				'asd',
				'asd',
				'asd',
				'zzzzzzzz empt1',
				'2',
				'3',
				'4'
			])
		);
	});

	test('advanced', () => {
		testSimpleApplyEdits(
			[
				' {       "d": [',
				'             null',
				'        ] /*comment*/',
				'        ,"e": /*comment*/ [null] }',
			],
			[
				editOp(1, 1, 1, 2, 0, 1, ['']),
				editOp(1, 3, 1, 10, 2, 7, ['', '  ']),
				editOp(1, 16, 2, 14, 15, 14, ['', '    ']),
				editOp(2, 18, 3, 9, 33, 9, ['', '  ']),
				editOp(3, 22, 4, 9, 55, 9, ['']),
				editOp(4, 10, 4, 10, 65, 0, ['', '  ']),
				editOp(4, 28, 4, 28, 83, 0, ['', '    ']),
				editOp(4, 32, 4, 32, 87, 0, ['', '  ']),
				editOp(4, 33, 4, 34, 88, 1, ['', ''])
			],
			editOp(1, 1, 4, 34, 0, 89, [
				'{',
				'  "d": [',
				'    null',
				'  ] /*comment*/,',
				'  "e": /*comment*/ [',
				'    null',
				'  ]',
				''
			])
		);
	});

	test('advanced simplified', () => {
		testSimpleApplyEdits(
			[
				'   abc',
				' ,def'
			],
			[
				editOp(1, 1, 1, 4, 0, 3, ['']),
				editOp(1, 7, 2, 2, 6, 2, ['']),
				editOp(2, 3, 2, 3, 9, 0, ['', ''])
			],
			editOp(1, 1, 2, 3, 0, 9, [
				'abc,',
				''
			])
		);
	});
});

suite('EditorModel - EditableTextModel.applyEdits updates mightContainRTL', () => {

	function testApplyEdits(original: string[], edits: IIdentifiedSingleEditOperation[], before: boolean, after: boolean): void {
		let model = createEditableTextModelFromString(original.join('\n'));
		model.setEOL(EndOfLineSequence.LF);

		assert.equal(model.mightContainRTL(), before);

		model.applyEdits(edits);
		assert.equal(model.mightContainRTL(), after);
		model.dispose();
	}

	function editOp(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number, text: string[]): IIdentifiedSingleEditOperation {
		return {
			identifier: null,
			range: new Range(startLineNumber, startColumn, endLineNumber, endColumn),
			text: text.join('\n'),
			forceMoveMarkers: false
		};
	}

	test('start with RTL, insert LTR', () => {
		testApplyEdits(['Hello,\nזוהי עובדה מבוססת שדעתו'], [editOp(1, 1, 1, 1, ['hello'])], true, true);
	});

	test('start with RTL, delete RTL', () => {
		testApplyEdits(['Hello,\nזוהי עובדה מבוססת שדעתו'], [editOp(1, 1, 10, 10, [''])], true, true);
	});

	test('start with RTL, insert RTL', () => {
		testApplyEdits(['Hello,\nזוהי עובדה מבוססת שדעתו'], [editOp(1, 1, 1, 1, ['هناك حقيقة مثبتة منذ زمن طويل'])], true, true);
	});

	test('start with LTR, insert LTR', () => {
		testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['hello'])], false, false);
	});

	test('start with LTR, insert RTL 1', () => {
		testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['هناك حقيقة مثبتة منذ زمن طويل'])], false, true);
	});

	test('start with LTR, insert RTL 2', () => {
		testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['זוהי עובדה מבוססת שדעתו'])], false, true);
	});
});


suite('EditorModel - EditableTextModel.applyEdits updates mightContainNonBasicASCII', () => {

	function testApplyEdits(original: string[], edits: IIdentifiedSingleEditOperation[], before: boolean, after: boolean): void {
		let model = createEditableTextModelFromString(original.join('\n'));
		model.setEOL(EndOfLineSequence.LF);

		assert.equal(model.mightContainNonBasicASCII(), before);

		model.applyEdits(edits);
		assert.equal(model.mightContainNonBasicASCII(), after);
		model.dispose();
	}

	function editOp(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number, text: string[]): IIdentifiedSingleEditOperation {
		return {
			identifier: null,
			range: new Range(startLineNumber, startColumn, endLineNumber, endColumn),
			text: text.join('\n'),
			forceMoveMarkers: false
		};
	}

	test('start with NON-ASCII, insert ASCII', () => {
		testApplyEdits(['Hello,\nZürich'], [editOp(1, 1, 1, 1, ['hello', 'second line'])], true, true);
	});

	test('start with NON-ASCII, delete NON-ASCII', () => {
		testApplyEdits(['Hello,\nZürich'], [editOp(1, 1, 10, 10, [''])], true, true);
	});

	test('start with NON-ASCII, insert NON-ASCII', () => {
		testApplyEdits(['Hello,\nZürich'], [editOp(1, 1, 1, 1, ['Zürich'])], true, true);
	});

	test('start with ASCII, insert ASCII', () => {
		testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['hello', 'second line'])], false, false);
	});

	test('start with ASCII, insert NON-ASCII', () => {
		testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['Zürich', 'Zürich'])], false, true);
	});

});

suite('EditorModel - EditableTextModel.applyEdits', () => {

	function editOp(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number, text: string[]): IIdentifiedSingleEditOperation {
		return {
			identifier: null,
			range: new Range(startLineNumber, startColumn, endLineNumber, endColumn),
			text: text.join('\n'),
			forceMoveMarkers: false
		};
	}

	test('high-low surrogates 1', () => {
		testApplyEditsWithSyncedModels(
			[
				'📚some',
				'very nice',
				'text'
			],
			[
				editOp(1, 2, 1, 2, ['a'])
			],
			[
				'a📚some',
				'very nice',
				'text'
			],
/*inputEditsAreInvalid*/true
		);
	});
	test('high-low surrogates 2', () => {
		testApplyEditsWithSyncedModels(
			[
				'📚some',
				'very nice',
				'text'
			],
			[
				editOp(1, 2, 1, 3, ['a'])
			],
			[
				'asome',
				'very nice',
				'text'
			],
/*inputEditsAreInvalid*/true
		);
	});
	test('high-low surrogates 3', () => {
		testApplyEditsWithSyncedModels(
			[
				'📚some',
				'very nice',
				'text'
			],
			[
				editOp(1, 1, 1, 2, ['a'])
			],
			[
				'asome',
				'very nice',
				'text'
			],
/*inputEditsAreInvalid*/true
		);
	});
	test('high-low surrogates 4', () => {
		testApplyEditsWithSyncedModels(
			[
				'📚some',
				'very nice',
				'text'
			],
			[
				editOp(1, 1, 1, 3, ['a'])
			],
			[
				'asome',
				'very nice',
				'text'
			],
/*inputEditsAreInvalid*/true
		);
	});

	test('Bug 19872: Undo is funky', () => {
		testApplyEditsWithSyncedModels(
			[
				'something',
				' A',
				'',
				' B',
				'something else'
			],
			[
				editOp(2, 1, 2, 2, ['']),
				editOp(3, 1, 4, 2, [''])
			],
			[
				'something',
				'A',
				'B',
				'something else'
			]
		);
	});

	test('Bug 19872: Undo is funky', () => {
		testApplyEditsWithSyncedModels(
			[
				'something',
				'A',
				'B',
				'something else'
			],
			[
				editOp(2, 1, 2, 1, [' ']),
				editOp(3, 1, 3, 1, ['', ' '])
			],
			[
				'something',
				' A',
				'',
				' B',
				'something else'
			]
		);
	});

	test('insert empty text', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 1, 1, [''])
			],
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('last op is no-op', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 1, 2, ['']),
				editOp(4, 1, 4, 1, [''])
			],
			[
				'y First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('insert text without newline 1', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 1, 1, ['foo '])
			],
			[
				'foo My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('insert text without newline 2', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 3, 1, 3, [' foo'])
			],
			[
				'My foo First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('insert one newline', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 4, 1, 4, ['', ''])
			],
			[
				'My ',
				'First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('insert text with one newline', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 3, 1, 3, [' new line', 'No longer'])
			],
			[
				'My new line',
				'No longer First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('insert text with two newlines', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 3, 1, 3, [' new line', 'One more line in the middle', 'No longer'])
			],
			[
				'My new line',
				'One more line in the middle',
				'No longer First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('insert text with many newlines', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 3, 1, 3, ['', '', '', '', ''])
			],
			[
				'My',
				'',
				'',
				'',
				' First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('insert multiple newlines', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 3, 1, 3, ['', '', '', '', '']),
				editOp(3, 15, 3, 15, ['a', 'b'])
			],
			[
				'My',
				'',
				'',
				'',
				' First Line',
				'\t\tMy Second Line',
				'    Third Linea',
				'b',
				'',
				'1'
			]
		);
	});

	test('delete empty text', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 1, 1, [''])
			],
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('delete text from one line', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 1, 2, [''])
			],
			[
				'y First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('delete text from one line 2', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 1, 3, ['a'])
			],
			[
				'a First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('delete all text from a line', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 1, 14, [''])
			],
			[
				'',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('delete text from two lines', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 4, 2, 6, [''])
			],
			[
				'My Second Line',
				'    Third Line',
				'',
				'1'
			]
		);
	});

	test('delete text from many lines', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 4, 3, 5, [''])
			],
			[
				'My Third Line',
				'',
				'1'
			]
		);
	});

	test('delete everything', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'1'
			],
			[
				editOp(1, 1, 5, 2, [''])
			],
			[
				''
			]
		);
	});

	test('two unrelated edits', () => {
		testApplyEditsWithSyncedModels(
			[
				'My First Line',
				'\t\tMy Second Line',
				'    Third Line',
				'',
				'123'
			],
			[
				editOp(2, 1, 2, 3, ['\t']),
				editOp(3, 1, 3, 5, [''])
			],
			[
				'My First Line',
				'\tMy Second Line',
				'Third Line',
				'',
				'123'
			]
		);
	});

	test('two edits on one line', () => {
		testApplyEditsWithSyncedModels(
			[
				'\t\tfirst\t    ',
				'\t\tsecond line',
				'\tthird line',
				'fourth line',
				'\t\t<!@#fifth#@!>\t\t'
			],
			[
				editOp(5, 3, 5, 7, ['']),
				editOp(5, 12, 5, 16, [''])
			],
			[
				'\t\tfirst\t    ',
				'\t\tsecond line',
				'\tthird line',
				'fourth line',
				'\t\tfifth\t\t'
			]
		);
	});

	test('many edits', () => {
		testApplyEditsWithSyncedModels(
			[
				'{"x" : 1}'
			],
			[
				editOp(1, 2, 1, 2, ['\n  ']),
				editOp(1, 5, 1, 6, ['']),
				editOp(1, 9, 1, 9, ['\n'])
			],
			[
				'{',
				'  "x": 1',
				'}'
			]
		);
	});

	test('many edits reversed', () => {
		testApplyEditsWithSyncedModels(
			[
				'{',
				'  "x": 1',
				'}'
			],
			[
				editOp(1, 2, 2, 3, ['']),
				editOp(2, 6, 2, 6, [' ']),
				editOp(2, 9, 3, 1, [''])
			],
			[
				'{"x" : 1}'
			]
		);
	});

	test('replacing newlines 1', () => {
		testApplyEditsWithSyncedModels(
			[
				'{',
				'"a": true,',
				'',
				'"b": true',
				'}'
			],
			[
				editOp(1, 2, 2, 1, ['', '\t']),
				editOp(2, 11, 4, 1, ['', '\t'])
			],
			[
				'{',
				'\t"a": true,',
				'\t"b": true',
				'}'
			]
		);
	});

	test('replacing newlines 2', () => {
		testApplyEditsWithSyncedModels(
			[
				'some text',
				'some more text',
				'now comes an empty line',
				'',
				'after empty line',
				'and the last line'
			],
			[
				editOp(1, 5, 3, 1, [' text', 'some more text', 'some more text']),
				editOp(3, 2, 4, 1, ['o more lines', 'asd', 'asd', 'asd']),
				editOp(5, 1, 5, 6, ['zzzzzzzz']),
				editOp(5, 11, 6, 16, ['1', '2', '3', '4'])
			],
			[
				'some text',
				'some more text',
				'some more textno more lines',
				'asd',
				'asd',
				'asd',
				'zzzzzzzz empt1',
				'2',
				'3',
				'4ne'
			]
		);
	});

	test('advanced 1', () => {
		testApplyEditsWithSyncedModels(
			[
				' {       "d": [',
				'             null',
				'        ] /*comment*/',
				'        ,"e": /*comment*/ [null] }',
			],
			[
				editOp(1, 1, 1, 2, ['']),
				editOp(1, 3, 1, 10, ['', '  ']),
				editOp(1, 16, 2, 14, ['', '    ']),
				editOp(2, 18, 3, 9, ['', '  ']),
				editOp(3, 22, 4, 9, ['']),
				editOp(4, 10, 4, 10, ['', '  ']),
				editOp(4, 28, 4, 28, ['', '    ']),
				editOp(4, 32, 4, 32, ['', '  ']),
				editOp(4, 33, 4, 34, ['', ''])
			],
			[
				'{',
				'  "d": [',
				'    null',
				'  ] /*comment*/,',
				'  "e": /*comment*/ [',
				'    null',
				'  ]',
				'}',
			]
		);
	});

	test('advanced simplified', () => {
		testApplyEditsWithSyncedModels(
			[
				'   abc',
				' ,def'
			],
			[
				editOp(1, 1, 1, 4, ['']),
				editOp(1, 7, 2, 2, ['']),
				editOp(2, 3, 2, 3, ['', ''])
			],
			[
				'abc,',
				'def'
			]
		);
	});

	test('issue #144', () => {
		testApplyEditsWithSyncedModels(
			[
				'package caddy',
				'',
				'func main() {',
				'\tfmt.Println("Hello World! :)")',
				'}',
				''
			],
			[
				editOp(1, 1, 6, 1, [
					'package caddy',
					'',
					'import "fmt"',
					'',
					'func main() {',
					'\tfmt.Println("Hello World! :)")',
					'}',
					''
				])
			],
			[
				'package caddy',
				'',
				'import "fmt"',
				'',
				'func main() {',
				'\tfmt.Println("Hello World! :)")',
				'}',
				''
			]
		);
	});

	test('issue #2586 Replacing selected end-of-line with newline locks up the document', () => {
		testApplyEditsWithSyncedModels(
			[
				'something',
				'interesting'
			],
			[
				editOp(1, 10, 2, 1, ['', ''])
			],
			[
				'something',
				'interesting'
			]
		);
	});

	test('issue #3980', () => {
		testApplyEditsWithSyncedModels(
			[
				'class A {',
				'    someProperty = false;',
				'    someMethod() {',
				'    this.someMethod();',
				'    }',
				'}',
			],
			[
				editOp(1, 8, 1, 9, ['', '']),
				editOp(3, 17, 3, 18, ['', '']),
				editOp(3, 18, 3, 18, ['    ']),
				editOp(4, 5, 4, 5, ['    ']),
			],
			[
				'class A',
				'{',
				'    someProperty = false;',
				'    someMethod()',
				'    {',
				'        this.someMethod();',
				'    }',
				'}',
			]
		);
	});

	function testApplyEditsFails(original: string[], edits: IIdentifiedSingleEditOperation[]): void {
		let model = createEditableTextModelFromString(original.join('\n'));

		let hasThrown = false;
		try {
			model.applyEdits(edits);
		} catch (err) {
			hasThrown = true;
		}
		assert.ok(hasThrown, 'expected model.applyEdits to fail.');

		model.dispose();
	}

	test('touching edits: two inserts at the same position', () => {
		testApplyEditsWithSyncedModels(
			[
				'hello world'
			],
			[
				editOp(1, 1, 1, 1, ['a']),
				editOp(1, 1, 1, 1, ['b']),
			],
			[
				'abhello world'
			]
		);
	});

	test('touching edits: insert and replace touching', () => {
		testApplyEditsWithSyncedModels(
			[
				'hello world'
			],
			[
				editOp(1, 1, 1, 1, ['b']),
				editOp(1, 1, 1, 3, ['ab']),
			],
			[
				'babllo world'
			]
		);
	});

	test('overlapping edits: two overlapping replaces', () => {
		testApplyEditsFails(
			[
				'hello world'
			],
			[
				editOp(1, 1, 1, 2, ['b']),
				editOp(1, 1, 1, 3, ['ab']),
			]
		);
	});

	test('overlapping edits: two overlapping deletes', () => {
		testApplyEditsFails(
			[
				'hello world'
			],
			[
				editOp(1, 1, 1, 2, ['']),
				editOp(1, 1, 1, 3, ['']),
			]
		);
	});

	test('touching edits: two touching replaces', () => {
		testApplyEditsWithSyncedModels(
			[
				'hello world'
			],
			[
				editOp(1, 1, 1, 2, ['H']),
				editOp(1, 2, 1, 3, ['E']),
			],
			[
				'HEllo world'
			]
		);
	});

	test('touching edits: two touching deletes', () => {
		testApplyEditsWithSyncedModels(
			[
				'hello world'
			],
			[
				editOp(1, 1, 1, 2, ['']),
				editOp(1, 2, 1, 3, ['']),
			],
			[
				'llo world'
			]
		);
	});

	test('touching edits: insert and replace', () => {
		testApplyEditsWithSyncedModels(
			[
				'hello world'
			],
			[
				editOp(1, 1, 1, 1, ['H']),
				editOp(1, 1, 1, 3, ['e']),
			],
			[
				'Hello world'
			]
		);
	});

	test('touching edits: replace and insert', () => {
		testApplyEditsWithSyncedModels(
			[
				'hello world'
			],
			[
				editOp(1, 1, 1, 3, ['H']),
				editOp(1, 3, 1, 3, ['e']),
			],
			[
				'Hello world'
			]
		);
	});

	test('change while emitting events 1', () => {

		assertSyncedModels('Hello', (model, assertMirrorModels) => {
			model.applyEdits([{
				identifier: null,
				range: new Range(1, 6, 1, 6),
				text: ' world!',
				forceMoveMarkers: false
			}]);

			assertMirrorModels();

		}, (model) => {
			var isFirstTime = true;
			model.onDidChangeRawContent(() => {
				if (!isFirstTime) {
					return;
				}
				isFirstTime = false;

				model.applyEdits([{
					identifier: null,
					range: new Range(1, 13, 1, 13),
					text: ' How are you?',
					forceMoveMarkers: false
				}]);
			});
		});
	});

	test('change while emitting events 2', () => {

		assertSyncedModels('Hello', (model, assertMirrorModels) => {
			model.applyEdits([{
				identifier: null,
				range: new Range(1, 6, 1, 6),
				text: ' world!',
				forceMoveMarkers: false
			}]);

			assertMirrorModels();

		}, (model) => {
			var isFirstTime = true;
			model.onDidChangeContent((e: IModelContentChangedEvent) => {
				if (!isFirstTime) {
					return;
				}
				isFirstTime = false;

				model.applyEdits([{
					identifier: null,
					range: new Range(1, 13, 1, 13),
					text: ' How are you?',
					forceMoveMarkers: false
				}]);
			});
		});
	});

	test('issue #1580: Changes in line endings are not correctly reflected in the extension host, leading to invalid offsets sent to external refactoring tools', () => {
		let model = createEditableTextModelFromString('Hello\nWorld!');
		assert.equal(model.getEOL(), '\n');

		let mirrorModel2 = new MirrorModel(null, model.getLinesContent(), model.getEOL(), model.getVersionId());
		let mirrorModel2PrevVersionId = model.getVersionId();

		model.onDidChangeContent((e: IModelContentChangedEvent) => {
			let versionId = e.versionId;
			if (versionId < mirrorModel2PrevVersionId) {
				console.warn('Model version id did not advance between edits (2)');
			}
			mirrorModel2PrevVersionId = versionId;
			mirrorModel2.onEvents(e);
		});

		let assertMirrorModels = () => {
			assert.equal(mirrorModel2.getText(), model.getValue(), 'mirror model 2 text OK');
			assert.equal(mirrorModel2.version, model.getVersionId(), 'mirror model 2 version OK');
		};

		model.setEOL(EndOfLineSequence.CRLF);
		assertMirrorModels();

		model.dispose();
		mirrorModel2.dispose();
	});
});
