import * as vscode from 'vscode';
import { JavaClassEditorProvider } from './javaClassEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(JavaClassEditorProvider.register(context));
}
