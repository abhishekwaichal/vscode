/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vs/nls';
import { IDiffEditor } from 'vs/editor/browser/editorBrowser';
import { registerDiffEditorContribution } from 'vs/editor/browser/editorExtensions';
import { IEditorContribution } from 'vs/editor/common/editorCommon';
import { Disposable, IDisposable } from 'vs/base/common/lifecycle';
import { FloatingClickWidget } from 'vs/workbench/browser/parts/editor/editorWidgets';
import { IDiffComputationResult } from 'vs/editor/common/services/editorWorkerService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConfigurationService, ConfigurationTarget } from 'vs/platform/configuration/common/configuration';

const enum WidgetState {
	Hidden,
	HintWhitespace,
	HintTimeout
}

class DiffEditorHelperContribution extends Disposable implements IEditorContribution {

	private _helperWidget: FloatingClickWidget | null;
	private _helperWidgetListener: IDisposable | null;
	private _state: WidgetState;

	constructor(
		private readonly _diffEditor: IDiffEditor,
		@IInstantiationService private readonly _instantiationService: IInstantiationService,
		@IConfigurationService private readonly _configurationService: IConfigurationService,
	) {
		super();
		this._helperWidget = null;
		this._helperWidgetListener = null;
		this._state = WidgetState.Hidden;


		this._register(this._diffEditor.onDidUpdateDiff(() => {
			this._setState(this._deduceState(this._diffEditor.getDiffComputationResult()));
		}));
	}

	private _deduceState(diffComputationResult: IDiffComputationResult | null): WidgetState {
		if (!diffComputationResult) {
			return WidgetState.Hidden;
		}
		if (this._diffEditor.ignoreTrimWhitespace && diffComputationResult.changes.length === 0 && !diffComputationResult.identical) {
			return WidgetState.HintWhitespace;
		}
		if (diffComputationResult.quitEarly) {
			return WidgetState.HintTimeout;
		}
		return WidgetState.Hidden;
	}

	private _setState(newState: WidgetState) {
		if (this._state === newState) {
			return;
		}

		this._state = newState;

		if (this._helperWidgetListener) {
			this._helperWidgetListener.dispose();
			this._helperWidgetListener = null;
		}
		if (this._helperWidget) {
			this._helperWidget.dispose();
			this._helperWidget = null;
		}

		if (this._state === WidgetState.HintWhitespace) {
			this._helperWidget = this._instantiationService.createInstance(FloatingClickWidget, this._diffEditor.getModifiedEditor(), nls.localize('hintWhitespace', "Show Whitespace Differences"), null);
			this._helperWidgetListener = this._helperWidget.onClick(() => this._onDidClickHelperWidget());
			this._helperWidget.render();
		}

		if (this._state === WidgetState.HintTimeout) {
			this._helperWidget = this._instantiationService.createInstance(FloatingClickWidget, this._diffEditor.getModifiedEditor(), nls.localize('hintTimeout', "Remove diff computation timeout"), null);
			this._helperWidgetListener = this._helperWidget.onClick(() => this._onDidClickHelperWidget());
			this._helperWidget.render();
		}
	}

	private _onDidClickHelperWidget(): void {
		if (this._state === WidgetState.HintWhitespace) {
			this._configurationService.updateValue('diffEditor.ignoreTrimWhitespace', false, ConfigurationTarget.USER);
		}
		if (this._state === WidgetState.HintTimeout) {
			this._configurationService.updateValue('diffEditor.maximumComputationTime', 0, ConfigurationTarget.USER);
		}
	}

	dispose(): void {
		super.dispose();
	}

	getId(): string {
		return 'editor.contrib.diffEditorHelper';
	}
}

registerDiffEditorContribution(DiffEditorHelperContribution);