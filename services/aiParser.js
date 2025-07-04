const axios = require('axios');

async function parsePrompt(prompt) {
    try {
        console.log('API Key present:', !!process.env.AI_API_KEY);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.AI_API_KEY}`;
        console.log('Sending request to Gemini API...');
        
        const enhancedPrompt = `Parse this prompt and return a JSON object with the following structure:
{
  "object": "ObjectName",
  "fields": [
    {
      "name": "fieldName",
      "label": "Field Label",
      "type": "FieldType",
      "length": 100,
      "precision": 18,
      "scale": 2,
      "defaultValue": false,
      "picklistValues": ["Option1", "Option2"]
    }
  ],
  "profileAccess": [
    {
      "profile": "ProfileName",
      "objectPermissions": { "allowRead": true, "allowCreate": true, "allowEdit": true, "allowDelete": false },
      "fields": [
        { "field": "FieldName", "readable": true, "editable": false }
      ]
    }
  ],
  "permissionSets": [
    {
      "name": "PermissionSetName",
      "label": "Permission Set Label",
      "objectPermissions": { "object": "ObjectName", "allowRead": true, "allowEdit": true },
      "fieldPermissions": [
        { "field": "ObjectName.FieldName", "readable": true, "editable": true }
      ]
    }
  ],
  "validationRules": [
    {
      "name": "ValidationRuleName",
      "errorMessage": "Error message to display",
      "errorConditionFormula": "Formula expression for validation"
    }
  ]
}

- For each profile mentioned, include a profileAccess entry.
- For each field that should have FLS, include a fields array with the field name and readable/editable booleans.
- If a field is only visible, set readable: true, editable: false.
- If a field is visible and editable, set both to true.
- If a field is not visible, set both to false.
- Only include fields in the fields array that should have FLS set for that profile.
- If the prompt mentions permission sets, include a permissionSets array as shown above.
- If the prompt mentions validation rules, include a validationRules array as shown above.

Here's the prompt to parse: ${prompt}`;

        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: enhancedPrompt
                }]
            }]
        });
        
        console.log('Received response from Gemini API');
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
        const result = response.data.candidates[0].content.parts[0].text;
        console.log('Extracted text:', result);
        
        // Try to parse the result as JSON, looking for any JSON-like string in the response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON object found in the response');
        }
        
        const parsedResult = JSON.parse(jsonMatch[0]);
        console.log('Parsed JSON:', parsedResult);
        
        // Validate the parsed result
        if (!parsedResult.object || !Array.isArray(parsedResult.fields)) {
            throw new Error('Invalid response format: missing object name or fields array');
        }
        
        // Transform to the expected format
        const transformedResult = {
            object: parsedResult.object,
            fields: parsedResult.fields.map(field => ({
                name: field.name,
                label: field.label,
                type: field.type,
                length: field.length,
                precision: field.precision,
                scale: field.scale,
                defaultValue: field.defaultValue,
                picklistValues: field.picklistValues
            })),
            profileAccess: parsedResult.profileAccess || [],
            permissionSets: parsedResult.permissionSets || [],
            validationRules: parsedResult.validationRules || []
        };
        
        return transformedResult;
    } catch (error) {
        console.error('Error in parsePrompt:', error);
        if (error.response) {
            console.error('API Response Error:', JSON.stringify(error.response.data, null, 2));
        }
        throw new Error(`Failed to parse prompt: ${error.message}`);
    }
}

module.exports = parsePrompt;