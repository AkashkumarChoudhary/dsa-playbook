import { indentWithTab } from '@codemirror/commands';
import { java } from '@codemirror/lang-java';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { basicSetup, EditorView } from 'codemirror';

export interface CodeEditor {
  getValue(): string;
  setValue(v: string): void;
  focus(): void;
  destroy(): void;
}

export function createEditor(parent: HTMLElement, doc: string, onChange: (v: string) => void): CodeEditor {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        basicSetup,
        java(),
        keymap.of([indentWithTab]),
        EditorView.contentAttributes.of({ 'aria-label': 'Java code editor. Press Escape then Tab to leave.' }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
  return {
    getValue: () => view.state.doc.toString(),
    setValue: (v) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: v } }),
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
