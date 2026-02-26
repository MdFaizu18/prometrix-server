// Groq API service layer
// Isolated here so any future model/provider changes stay confined to this file
import Groq from 'groq-sdk';
import config from '../config/env.config.js';
import AppError from '../utils/AppError.util.js';

const groq = new Groq({ apiKey: config.groq.apiKey });

/**
 * Dynamically builds a system prompt based on toolMode and context
 * This produces significantly better refinements than a generic system prompt
 */
const buildSystemPrompt = (toolMode, techStack, tone) => {
  const toneDescriptions = {
    formal: 'professional, precise, and structured',
    casual: 'conversational, friendly, and approachable',
    technical: 'technically detailed, developer-focused, and precise',
    creative: 'imaginative, exploratory, and open-ended',
    concise: 'minimal, clear, and to the point',
  };

  const toolInstructions = {
    cursor: `You are refining prompts for Cursor AI IDE. Focus on:
- Clear file/folder structure instructions
- Specific code patterns and conventions
- Step-by-step implementation guidance
- Context about existing codebase patterns`,
    v0: `You are refining prompts for Vercel v0 UI generation. Focus on:
- Clear component structure and hierarchy
- Specific UI/UX requirements
- Responsive design considerations
`,
    generic: `You are refining prompts for general AI use. Focus on:
- Clarity of intent
- Specific expected outputs
- Constraints and boundaries
- Context and background information`,
  };

  const techContext =
    techStack && techStack.length > 0
      ? `\nThe tech stack being used: ${techStack.join(', ')}. Tailor code examples and patterns accordingly.`
      : '';

  return `${toolInstructions[toolMode] || toolInstructions.generic}
${techContext}

Your response tone should be ${toneDescriptions[tone] || toneDescriptions.technical}.

When refining a prompt, you MUST:
1. Preserve the original intent
2. Add specificity and context where vague
3. Structure it with clear sections if complex
4. Remove ambiguity
5. Add example inputs/outputs if helpful

Respond ONLY with the refined prompt text. Do not add explanations, preambles, or meta-commentary.`;
};

/**
 * Refines a raw prompt using the Groq API
 * @param {string} rawPrompt - The user's original prompt
 * @param {string} toolMode - 'cursor' | 'v0' | 'generic'
 * @param {string[]} techStack - Array of technologies
 * @param {string} tone - Desired tone of refinement
 * @param {string} [modelOverride] - Optional model name to override the default
 * @returns {{ refinedPrompt: string, tokensUsed: number, model: string }}
 */
export const refinePrompt = async (
  rawPrompt,
  toolMode = 'generic',
  techStack = [],
  tone = 'technical',
  modelOverride
) => {
  try {
    const systemPrompt = buildSystemPrompt(toolMode, techStack, tone);

    const completion = await groq.chat.completions.create({
      model: modelOverride || config.groq.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please refine this prompt:\n\n${rawPrompt}`,
        },
      ],
      temperature: 0.4, // Lower temp for consistent, reliable refinements
      max_tokens: 2048,
    });

    const refinedPrompt = completion.choices[0]?.message?.content?.trim();

    if (!refinedPrompt) {
      throw new AppError('Groq returned an empty response', 502);
    }

    return {
      refinedPrompt,
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model,
    };
  } catch (error) {
    // Re-throw AppErrors as-is; wrap Groq SDK errors
    if (error.isOperational) throw error;

    const status = error.status || 502;
    const message = error.message?.includes('API key')
      ? 'Invalid Groq API key configuration'
      : `Groq API error: ${error.message}`;

    throw new AppError(message, status);
  }
};
