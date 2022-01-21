import * as vscode from 'vscode';
import { JavaClassEditorProvider } from './javaClassEditor';
import { execute } from 'njar';
import { join } from 'path';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(JavaClassEditorProvider.register(context));
	context.subscriptions.push(vscode.commands.registerCommand('javaCFRDecompiler.decompileInFolder', async (e: vscode.Uri) => {
		let pattern = new vscode.RelativePattern(e,'**/*.class');
		let files = await vscode.workspace.findFiles(pattern);
		for(let i in files){
			let file = files[i];
			await JavaClassEditorProvider.DecompileFile(file,context,null);
		}
		vscode.window.showInformationMessage(`Completed decompilation: ${vscode.workspace.asRelativePath(e)}`);
    }));
}
