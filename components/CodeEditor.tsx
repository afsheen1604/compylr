import React from "react";

interface CodeEditorProps {
    code: string;
    setCode: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode}) => {
    return (
        <div className="h-full rounded-lg bg-gray-800 border border-gray-700 p-4 overflow-hidden group">
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-transparent resize-none focus:outline-none font-mono text-sm text-gray-100"
                placeholder="Enter your code here..."
                spellCheck="false"
            />
        </div>
    );
};

export default CodeEditor;