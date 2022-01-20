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
	async resolveCustomEditor(document: JavaClassDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
		let content = "";
		try{
			content = await execute(join(this.context.extensionPath,'cfr-0.152.jar'),[document.uri.fsPath]);
		}catch(e){
			webviewPanel.webview.html += `<h1>Decompilation Error</h1><code>${e}</code>`;
			return;
		}
		webviewPanel.webview.html += '<code>'+content+'<code>';
		try{
			const parsedpath = parse(document.uri.fsPath);
			const newfile = join(parsedpath.dir,parsedpath.name+'.java');
			webviewPanel.webview.html += '<div>NEWFILE: '+newfile+'</div>';
			let newfileuri = vscode.Uri.file(newfile);
			let fileExists = false;
			try{
				await vscode.workspace.fs.stat(newfileuri);
				fileExists = true;
				newfileuri = newfileuri.with({scheme:'file'});
			}catch{
				fileExists = false;
				newfileuri = newfileuri.with({scheme:'untitled'});
			}
			const file = await vscode.workspace.openTextDocument(newfileuri);
			const editor = await vscode.window.showTextDocument(file,1,false);
			if(!fileExists){
				await editor.edit(edit=>{
					edit.insert(new vscode.Position(0, 0), content);
				});
			}
			webviewPanel.dispose();
		}catch(e){
			webviewPanel.webview.html += '<div>ERROR: '+e+'</div>';
		}
	}
}
