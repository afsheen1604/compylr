"use client";

import React from "react";
import CodeEditor from "@/components/CodeEditor";
import LanguageSelector from "@/components/LanguageSelector";
import OutputPanel from "@/components/OutputPanel";
import {Play} from "lucide-react";

const STARTER_CODE = {
  "javascript": '//Example:\nconsole.log("Hello, World!");',
  "python": '#Example:\nprint("Hello World")',
  "cpp": '//Example:\n#include <iostream>\n\nint main()\n{\n\tstd::cout << "Hello World";\n\treturn 0;\n}',
  "java": '//Example:\nSystem.out.println("Hello World");',
};

export default function Home() {
  const [code, setCode] = React.useState<string>("");
  const [output, setOutput] = React.useState<string>("");
  const [language, setLanguage] = React.useState<string>("javascript");
  const [error, setError] = React.useState<string>("");
  const [isRunning, setIsRunning] = React.useState<boolean>(false);

  React.useEffect(() => {
    setCode(STARTER_CODE[language as keyof typeof STARTER_CODE]);
  }, [language]);

  const handleRun = async () => {
    setIsRunning(true);
    setError("");
    setOutput("");

    try{
      if(code.trim() === ""){
        throw new Error("Please enter some code to run");
      }

      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({code, language}),
      });

      const data = await response.json();

      if(data.error){
        setError(data.error);
      }
      else{
        setOutput(data.output);
      }
    } catch(err: any){
      setError(err.message);
    } finally{
      setIsRunning(false);
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if((e.ctrlKey || e.metaKey) && e.key === "Enter"){
      handleRun();
    }
  };

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [code, language]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Compylr
            </h1>
            <span className="text-sm text-gray-400">
              Press Ctrl+Enter to run
            </span>
          </div>
          <LanguageSelector language={language} setLanguage={setLanguage}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
          <div className="relative">
            <CodeEditor code={code} setCode={setCode}/>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Play className="w-4 h-4"/>
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>
          <OutputPanel output={output} error={error}/>
        </div>
      </div>
    </main>
  );
}