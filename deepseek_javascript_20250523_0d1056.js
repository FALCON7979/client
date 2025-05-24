const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuration for OpenAI (would use environment variables in production)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Website generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, features } = req.body;
    
    // Construct the AI prompt
    const aiPrompt = `Generate a complete website based on the following description: ${prompt}. 
    Requirements:
    - Design style: Modern with ${features.darkMode ? 'dark theme' : 'light theme'}
    - ${features.animations ? 'Include smooth animations' : 'No animations needed'}
    - ${features.responsive ? 'Fully responsive design' : 'Desktop-only design'}
    - ${features.forms ? 'Include a contact form' : 'No forms needed'}
    - ${features.seo ? 'Include SEO optimization' : 'No SEO needed'}
    
    Provide the complete code in this JSON format:
    {
      "html": "complete HTML code",
      "css": "complete CSS code",
      "js": "complete JavaScript code",
      "backend": "Node.js backend code if forms are enabled",
      "schema": "JSON content schema"
    }`;
    
    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional web developer. Generate complete, production-ready website code based on user requirements."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      temperature: 0.7,
    });
    
    // Extract and parse the generated code
    const content = response.data.choices[0].message.content;
    let generatedCode;
    
    try {
      generatedCode = JSON.parse(content);
    } catch (e) {
      // Fallback if JSON parsing fails
      generatedCode = extractCodeFromText(content);
    }
    
    res.json(generatedCode);
    
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate website' });
  }
});

// Helper function to extract code if JSON parsing fails
function extractCodeFromText(text) {
  const htmlMatch = text.match(/```html\n([\s\S]*?)\n```/);
  const cssMatch = text.match(/```css\n([\s\S]*?)\n```/);
  const jsMatch = text.match(/```javascript\n([\s\S]*?)\n```/);
  const backendMatch = text.match(/```javascript\n([\s\S]*?)\n```/g);
  const schemaMatch = text.match(/```json\n([\s\S]*?)\n```/);
  
  return {
    html: htmlMatch ? htmlMatch[1] : '<html>Failed to generate HTML</html>',
    css: cssMatch ? cssMatch[1] : '/* Failed to generate CSS */',
    js: jsMatch ? jsMatch[1] : '// Failed to generate JS',
    backend: backendMatch && backendMatch.length > 1 ? backendMatch[1] : '',
    schema: schemaMatch ? schemaMatch[1] : '{}'
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});