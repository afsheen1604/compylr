import { NextResponse } from "next/server";

const LANGUAGE_IDS = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,    
};

const JUDGE_API = 
    process.env.JUDGE_API || "https://judge0-ce.p.rapidapi.com";
const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = process.env.RAPID_API_HOST;

async function submitCode(sourceCode: string, languageId: number) {
    try {
        const response = await fetch(`${JUDGE_API}/submissions`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "X-RapidAPI-Key": RAPID_API_KEY!,
                "X-RapidAPI-Host": RAPID_API_HOST!,
            },
            body: JSON.stringify({
                source_code: sourceCode,
                language_id: languageId,
                stdin: "",
            }),
        });

        if (!response.ok) {
            console.error("Submit response not ok:", response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        console.log("Submit response data:", data);
        return data.token;
    } catch (error) {
        console.error("Error submitting code:", error);
        return null;
    }
}

async function getResult(token: string) {
    try {
        const response = await fetch(`${JUDGE_API}/submissions/${token}`, {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": RAPID_API_KEY!,
                "X-RapidAPI-Host": RAPID_API_HOST!,
            },
        });

        if (!response.ok) {
            console.error("Get result response not ok:", response.status, response.statusText);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error getting result:", error);
        return null;
    }
}

export async function POST(req: Request) {
    try{
        const {code, language} = await req.json();
        console.log("Received language:", language);
        console.log("Received code:", code);
        
        const languageId = LANGUAGE_IDS[language as keyof typeof LANGUAGE_IDS];
        if (!languageId) {
            return NextResponse.json(
                {error: `Unsupported language: ${language}`}, 
                {status: 400}
            );
        }

        console.log("Language ID:", languageId);

        // Check if API credentials are set
        if (!RAPID_API_KEY || !RAPID_API_HOST) {
            return NextResponse.json(
                {error: "API credentials not configured. Please set RAPID_API_KEY and RAPID_API_HOST in your environment variables."}, 
                {status: 500}
            );
        }

        let sourceCode = code;
        if(language === "java") {
            // Check if code already contains a complete class definition
            if (!code.trim().includes("public class") && !code.trim().includes("class ")) {
                // Wrap simple statements in Main class
                sourceCode = `public class Main {
    public static void main(String[] args) {
        ${code}
    }
}`;
            }
        }

        console.log("Submitting code...");
        const token = await submitCode(sourceCode, languageId);
        console.log("Received token:", token);

        if (!token) {
            return NextResponse.json(
                {error: "Failed to submit code. Please check your API credentials."}, 
                {status: 500}
            );
        }

        let result;
        for(let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = await getResult(token);
            console.log(`Attempt ${i + 1} - Result:`, JSON.stringify(result, null, 2));
            
            if (!result) {
                console.log("No result returned");
                continue;
            }

            if (!result.status) {
                console.log("No status in result");
                continue;
            }

            if(result.status.id !== 1 && result.status.id !== 2) {
                break;
            }
        }

        if (!result) {
            return NextResponse.json({
                output: null,
                error: "No result received from code execution service",
            });
        }

        if (!result.status) {
            return NextResponse.json({
                output: null,
                error: "Invalid response from code execution service",
            });
        }

        if(result.status.id === 3){
            return NextResponse.json({
                output: result.stdout || "Code executed successfully with no output",
                error: null,
            });
        } else if(result.status.id === 6){
            return NextResponse.json({
                output: null,
                error: result.compile_output || "Compilation error",
            });
        } 
        else if(result.stderr){
            return NextResponse.json({
                output: null,
                error: result.stderr,
            });
        } else{
            return NextResponse.json({
                output: null,
                error: result.status.description || "Unknown error occurred",
            });
        }
    } catch(error: unknown){
    console.error("API Error:", error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
    }

}