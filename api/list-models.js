// api/list-models.js
export default async function handler(req, res) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    const data = await response.json();
    
    // Filter only models that support generateContent
    const generateModels = data.models?.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    );
    
    return res.status(200).json({
      available_models: generateModels?.map(m => m.name) || [],
      full_data: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}