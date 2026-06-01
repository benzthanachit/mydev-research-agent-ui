import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// System prompts for each agent
const AGENT_SYSTEM_PROMPTS = {
  manager: `You are Project Meow-nager, the central director of the Meow-nuscript Office. 
Your job is to coordinate research tasks, synthesize reviewer comments, and guide the user.
Your personality is professional, polite, organized, and slightly cat-like (using terms like "purr-fect", "meow-tastic" occasionally, but remaining focused on helping the academic).
When presented with critiques, synthesize them into clear, actionable bullet points and advise what details are needed to refine the draft.`,

  scribe: `You are The Scribe Cat, a distinguished academic drafter. 
Your personality is intellectual, scholarly, and extremely focused on clear, rigorous writing.
Your task is to write detailed, high-quality chapter drafts for Scopus Q3/Q4 journals.
GUIDELINES:
1. Write in a formal academic tone.
2. Emphasize sound methodology, step-by-step explanations, and clarity.
3. Integrate data pipelines, algorithms, equations, or concepts provided in the inputs (e.g., Hybrid Inventory Forecasting or neural networks).
4. Strictly avoid overclaiming, exaggerations, or buzzwords. Keep claims humble and grounded in facts.
5. Format your output in clean Markdown with clear headings.`,

  reviewer: `You are Grumpy Reviewer, a strict and highly critical peer-reviewer for Scopus Q3/Q4 journals. 
Your personality is skeptical, rigorous, direct, and easily annoyed by weak arguments or loose methodology.
Your task is to evaluate the drafted chapter. You do not demand groundbreaking Nobel-prize novelty. Instead, you strictly demand:
1. Sound and complete methodology (every step must be explained).
2. Logical consistency (no self-contradicting statements).
3. No overclaiming (if results show a 5% improvement, do not call it "a revolutionary paradigm shift").
4. Clear explanations of terms and formulas.

IMPORTANT FORMAT RULES:
- You must begin your critique response with exactly "[FAIL]" or "[PASS]".
- If you write "[FAIL]", follow it immediately with a bulleted list of rigorous critiques that the author must address before approval. Be specific!
- If you write "[PASS]", provide a brief summary of why the chapter is sound enough for a Q3/Q4 journal, noting any minor adjustments.`,

  librarian: `You are The Librarian Cat, a meticulous referencing and citation specialist cat. 
Your personality is quiet, precise, detail-oriented, and obsessed with clean citation styles (APA, IEEE, Harvard).
Your job is to scan the draft for citations and verify their formatting and consistency.
Provide a clean bulleted review outlining:
1. Are citations mapped correctly? (e.g., matching in-text bracket styles).
2. Are references formatted correctly?
3. Mention any missing citations or inconsistencies in citation styles.`
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      chapter = "Chapter 1: Introduction",
      agentType = "scribe",
      variables = {},
      draft = "",
      critique = "",
      obsidianLogs = "",
      apiKey = ""
    } = body;

    const actualApiKey = apiKey || process.env.GEMINI_API_KEY;
    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentType as keyof typeof AGENT_SYSTEM_PROMPTS] || AGENT_SYSTEM_PROMPTS.manager;

    // Build the user prompt context based on the agent type and workflow state
    let userPrompt = "";

    if (agentType === "scribe") {
      userPrompt = `You are drafting ${chapter}.
RESEARCH METADATA / INPUTS:
- Title: ${variables.title || "Untitled Research"}
- Methodology Concepts: ${variables.methodology || "Not specified"}
- Data Pipelines / Equations: ${variables.pipeline || "Not specified"}
- Target Audience: Scopus Q3/Q4 Journal

OBSIDIAN WORKING MEMORY (Micro-Facts & Decisions):
${obsidianLogs ? obsidianLogs : "No prior decision logs."}

${critique ? `PREVIOUS CRITIQUE FROM GRUMPY REVIEWER:
${critique}
Please refine the draft to address these specific points.` : "This is the initial draft. Create a comprehensive, formal academic section."}

Begin writing the draft in high-quality academic Markdown. Keep it thorough and clean:`;
    } 
    
    else if (agentType === "reviewer") {
      userPrompt = `You are reviewing ${chapter} for publication in a Scopus Q3/Q4 journal.
CURRENT RESEARCH DRAFT:
\"\"\"
${draft}
\"\"\"

RESEARCH VARIABLES:
- Title: ${variables.title || "Untitled Research"}
- Method: ${variables.methodology || "Not specified"}

Evaluate this draft strictly. Look for gaps, overclaims, or logical inconsistencies.
Begin your response with "[FAIL]" or "[PASS]" followed by your feedback.`;
    } 
    
    else if (agentType === "librarian") {
      userPrompt = `You are checking referencing styling for ${chapter}.
CURRENT DRAFT CONTENT:
\"\"\"
${draft}
\"\"\"

Verify all in-text citations. Make sure they conform to academic standards (e.g., APA/IEEE). Highlight any formatting errors or mismatched references.`;
    } 
    
    else {
      // Manager
      userPrompt = `Summarize the current progress for ${chapter}.
DRAFT CURRENTLY:
${draft ? "Draft exists (see workbench)." : "No draft yet."}

REVIEWER CRITIQUE SUMMARY:
${critique || "No critiques received yet."}

Provide a short, cute retro-RPG cat manager status update and ask the user what detail they'd like to provide next.`;
    }

    // Live API Mode
    if (actualApiKey && actualApiKey.trim() !== "") {
      try {
        const genAI = new GoogleGenerativeAI(actualApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
          }
        });

        const textResponse = result.response.text();
        return NextResponse.json({ text: textResponse, mode: "api" });
      } catch (err: any) {
        console.error("Gemini API error, falling back to mock mode:", err);
        // Fallback to mock if API fails due to key/network issues
        return NextResponse.json(getMockResponse(agentType, chapter, variables, critique, draft, err.message));
      }
    }

    // Mock Mode fallback if no API key is specified
    return NextResponse.json(getMockResponse(agentType, chapter, variables, critique, draft));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generates high-fidelity academic mocked content to guarantee out-of-the-box retro aesthetic and flawless offline demo
function getMockResponse(
  agentType: string,
  chapter: string,
  variables: any,
  critique: string,
  draft: string,
  errorReason?: string
) {
  const title = variables.title || "Hybrid Inventory Forecasting Framework";
  const methodology = variables.methodology || "LSTM neural network merged with traditional ARIMA models";
  const pipeline = variables.pipeline || "Data ingestion -> Kalman Filtering smoothing -> Feature Scaling -> Joint Model Training";

  let responseText = "";

  if (agentType === "scribe") {
    if (critique) {
      responseText = `# ${chapter}: Research Design and Methodology (Refined)

## 3.1 Overview of the Refined Hybrid Model
This section presents the step-by-step structural implementation of the hybrid forecasting design, specifically addressing the reviewer's critiques concerning parameter configuration. The proposed framework fuses the linear robustness of autoregressive integrated moving average (ARIMA) models with the non-linear learning capacity of Long Short-Term Memory (LSTM) recurrent networks.

Unlike traditional heuristic implementations, the proposed hybrid pipeline operates sequentially to process multivariate data. The raw dataset first undergoes noise filtration via a multi-dimensional Kalman Filter. 

$$\\hat{x}_{k|k} = \\hat{x}_{k|k-1} + K_k(z_k - H_k\\hat{x}_{k|k-1})$$

Where $K_k$ represents the Kalman gain matrix, which ensures optimal state estimation prior to neural network ingestion.

## 3.2 LSTM Hyperparameter Configuration (Addressed Critique)
To eliminate the logical ambiguity noted in the prior review, the LSTM cell structure consists of:
- **Input Dimension:** 4 lag-variables (ingested at 24-hour time steps).
- **Hidden Layers:** 2 layers containing 64 hidden units each.
- **Activation Function:** Hyperbolic tangent (tanh) with a hard-sigmoid gate activation.
- **Optimizer:** Adam (Adaptive Moment Estimation) configured with a learning rate of $\\eta = 0.001$, $\\beta_1 = 0.9$, and $\\beta_2 = 0.999$.
- **Dropout Rate:** 0.2 applied between dense projections to mitigate overfitting.

By integrating the stationary linear components estimated by the ARIMA model directly into the LSTM training cell state, the model avoids overfitting on limited training samples, which is common in standalone neural implementations for Scopus Q3/Q4 index studies.`;
    } else {
      responseText = `# \${chapter}: Research Design and Methodology

## 3.1 Overview of the Proposed Hybrid Architecture
The primary methodological objective of this work is to formulate a robust forecasting pipeline utilizing a hybrid approach. The structural flow combines:
1. **Linear Time-Series Modeling:** ARIMA ($p, d, q$) for extracting stationary linear trends.
2. **Non-linear Recurrent Modeling:** LSTM cells for capture long-term sequential dependencies.

The core pipeline is organized sequentially:
- **Data Ingestion:** Gathers stock inventories from local warehousing repositories.
- **Kalman Filtering:** Filters Gaussian sensor noise to provide clean baseline points.
- **LSTM Encoding:** Trains on the filtered residual variance.

\`\`\`
+------------------+     +------------------+     +------------------+
|   Raw Data       | --> |  Kalman Filter   | --> |   ARIMA Linear   |
|   (Stock Level)  |     |  Noise Reduction |     |   Forecasting    |
+------------------+     +------------------+     +------------------+
                                                           |
                                                           v
+------------------+     +------------------+     +------------------+
|   Final Forecast | <-- |  LSTM Residual   | <-- |   Residual       |
|   Aggregation    |     |  Deep Learning   |     |   Calculation    |
+------------------+     +------------------+     +------------------+
\`\`\`

## 3.2 Mathematical Formulation
The mathematical aggregation combines the linear projection $L_t$ and the non-linear projection $N_t$:

$$Y_t = L_t + N_t + e_t$$

Where:
- $Y_t$ is the actual stock value at time step $t$.
- $L_t$ is the forecasted linear trend value generated by the ARIMA process.
- $N_t$ is the neural predicted residual error of the time-step.
- $e_t$ is the stochastic white noise value of the combined framework.`;
    }
  } 
  
  else if (agentType === "reviewer") {
    // Reviewer has a random chance or depends on input variables to trigger a pass/fail
    const hasEquations = draft.includes("$$") || draft.includes("Kalman") || draft.includes("\\eta");
    if (!hasEquations) {
      responseText = `[FAIL]
* **Methodological Ambiguity:** The mathematical representation of the hybrid model is missing. You mention combining ARIMA and LSTM but fail to write the core formula $Y_t = L_t + N_t + e_t$ or define the parameters.
* **Hyperparameter Specifications Missing:** The text fails to document the LSTM model structure. You must specify the learning rate, dropout rate, and optimizer. Scopus Q3 peer reviews require complete step-by-step transparency.
* **Overclaiming of Results:** You state that this model is "an absolute paradigm shift for modern supply chain management." This is highly speculative and unsupported by your baseline results. Tone down this statement immediately.`;
    } else {
      responseText = `[PASS]
* **Sound Methodology:** The formulas and hybrid aggregation are now formally documented ($Y_t = L_t + N_t + e_t$). The Kalman filter gains are clearly mapped.
* **Hyperparameters Documented:** The Scribe has clarified the exact layer count (2 layers, 64 units) and optimization coefficients. This is sufficient for Q3/Q4 publication.
* **Toned Down Claims:** The terminology is suitably academic and avoids speculative overclaiming. Proceed to citation validation.`;
    }
  } 
  
  else if (agentType === "librarian") {
    responseText = `* **Citation Format Check:** Checked 4 in-text citations.
* **Correction Required:** The reference to (Kalman, 1960) on line 12 should be formatted in APA style. Please ensure it maps to a full entry in the references.
* **Mismatched Elements:** You cited 'ARIMA & Neural Systems' (Box & Jenkins, 1976) but it is not listed in the bibliography section.
* **Score:** 85% compliance. Standard IEEE brackets [1] or APA (Author, Year) format should be enforced uniformly.`;
  } 
  
  else {
    responseText = `Purr-fectly analyzed! 🐾 I am Project Meow-nager. The Scribe Cat has successfully compiled the drafting workspace. Grumpy Reviewer is waiting with its claws out. Let's send the current draft over for formal Scopus checks!`;
  }

  return {
    text: responseText,
    mode: "mock",
    notice: errorReason ? `Falling back to 8-bit local mock (Gemini Error: ${errorReason})` : "Running in 8-bit offline local mode."
  };
}
