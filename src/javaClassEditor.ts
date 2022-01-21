import * as vscode from 'vscode';
import { execute } from 'njar';
import { join, parse } from 'path';

class JavaClassDocument implements vscode.CustomDocument{
	constructor(uri:vscode.Uri) {this.uri = uri;}
	uri: vscode.Uri;
	dispose(): void {}
}
export class JavaClassEditorProvider implements vscode.CustomReadonlyEditorProvider {
	constructor(private readonly context: vscode.ExtensionContext) { }

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new JavaClassEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider('javaCFRDecompiler.javaClass', provider);
		return providerRegistration;
	}
	openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): JavaClassDocument {
		return new JavaClassDocument(uri);
	}
	static async DecompileFile(uri:vscode.Uri,context:vscode.ExtensionContext,webviewPanel:vscode.WebviewPanel|null):Promise<void>{
		try{
			const parsedpath = parse(uri.fsPath);
			const newfile = join(parsedpath.dir,parsedpath.name+'.java');//create prospective new java file path
			if(webviewPanel) webviewPanel.webview.html += `<div>NEWFILE: ${newfile}</div>`;
			let newfileuri = vscode.Uri.file(newfile);
			let fileExists = false;
			try{
				let newFileStat = await vscode.workspace.fs.stat(newfileuri);
				let classFileStat = await vscode.workspace.fs.stat(uri);
				fileExists = newFileStat.mtime > classFileStat.mtime
				newfileuri = newfileuri.with({scheme:'file'});
			}catch{
				fileExists = false;
				newfileuri = newfileuri.with({scheme:'untitled'});
			}
			let content = "";
			if(!fileExists){
				try{
					content = await execute(join(context.extensionPath,'cfr-0.152.jar'),[uri.fsPath]);
				}catch(e){
					if(webviewPanel) webviewPanel.webview.html += `<h1>Decompilation Error</h1><code>${e}</code>`;
					else vscode.window.showErrorMessage(`Failed to decompile ${vscode.workspace.asRelativePath(uri)} : ${e}`);
					return;
				}
				if(webviewPanel) webviewPanel.webview.html += `<code>${content}<code>`;
			}
			const file = await vscode.workspace.openTextDocument(newfileuri);
			const editor = await vscode.window.showTextDocument(file,1,webviewPanel == null);
			if(!fileExists){
				await editor.edit(edit=>{
					edit.delete(//Delete the entire contents of the file
						new vscode.Range(
							new vscode.Position(0,0),
							editor.document.lineAt(editor.document.lineCount-1).range.end
						)
					);
					edit.insert(new vscode.Position(0, 0), content);//Replace with new contents
				});
			}
			if(webviewPanel) webviewPanel.dispose();
			else await file.save();
		}catch(e){
			if(webviewPanel) webviewPanel.webview.html += `<div>ERROR: ${e}</div>`;
		}
	}
	async resolveCustomEditor(document: JavaClassDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
		await JavaClassEditorProvider.DecompileFile(document.uri,this.context,webviewPanel);
	}
}
