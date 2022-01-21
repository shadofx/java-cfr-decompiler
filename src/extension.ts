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
		await vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true
		},
		async(progress,token)=>{
			let inc = 1/files.length*100;
			for(const file of files){
				progress.report({
					message:`Decompiling: ${vscode.workspace.asRelativePath(file)}`,
					increment: inc
				});
				await JavaClassEditorProvider.DecompileFile(file,context,null)
				if(token.isCancellationRequested) return;
			}
		});
    }));
}
