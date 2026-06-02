import { config } from '../config';

interface AIPromptRequest {
  prompt: string;
  mode?: 'groq' | 'openai' | 'ollama' | 'local';
}

export async function generateTutorResponse({ prompt, mode = 'groq' }: AIPromptRequest) {
  if (mode === 'ollama') {
    return generateOllamaResponse(prompt);
  }

  if (mode === 'local') {
    return generateLocalModelResponse(prompt);
  }

  if (mode === 'openai') {
    return generateOpenAIResponse(prompt);
  }

  return generateGroqResponse(prompt);
}

async function generateGroqResponse(prompt: string) {
  if (!config.groqApiKey) {
    throw new Error('GROQ API key is not configured.');
  }

  const response = await fetch(config.groqApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.groqModel,
      input: prompt,
      temperature: 0.78,
      max_output_tokens: 650
    })
  });

  const payload = await response.json();
  return (
    payload?.output?.[0]?.content?.[0]?.text ||
    payload?.output_text ||
    payload?.choices?.[0]?.message?.content ||
    payload?.text ||
    'The AI tutor could not generate a response.'
  );
}

async function generateOpenAIResponse(prompt: string) {
  if (!config.openAiApiKey) {
    throw new Error('OpenAI API key is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openAiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'system', content: 'You are an adaptive AI tutor for students.' }, { role: 'user', content: prompt }],
      max_tokens: 650,
      temperature: 0.78
    })
  });

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content ?? 'The AI tutor could not generate a response.';
}

async function generateOllamaResponse(prompt: string) {
  const response = await fetch(`${config.ollamaUrl}/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama2', prompt })
  });
  const payload = await response.json();
  return payload?.text ?? 'Ollama did not return a response.';
}

async function generateLocalModelResponse(prompt: string) {
  const response = await fetch(`${config.localModelUrl}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, max_tokens: 650 })
  });
  const payload = await response.json();
  return payload?.text ?? 'Local LLM did not return a response.';
}
