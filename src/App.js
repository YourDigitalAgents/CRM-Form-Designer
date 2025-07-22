import React, { useState, useEffect, useCallback, useRef } from 'react';

// Helper component for a combined Range + Text Input
const RangeTextInput = ({ label, name, value, onChange, min, max, step, unit = 'px' }) => {
    const numericValue = parseFloat(value);
    const clampedValue = isNaN(numericValue) ? parseFloat(min) : Math.max(parseFloat(min), Math.min(parseFloat(max), numericValue));

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}:
            </label>
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    id={`${name}-range`}
                    min={min}
                    max={max}
                    step={step}
                    value={clampedValue}
                    onChange={(e) => onChange({ target: { name, value: `${e.target.value}${unit}` } })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                />
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-20 p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                />
            </div>
        </div>
    );
};

// Reusable Accordion Component for organizing the UI
const Accordion = ({ id, title, openAccordion, setOpenAccordion, children }) => {
    const isOpen = openAccordion === id;
    const toggleOpen = () => {
        setOpenAccordion(isOpen ? '' : id);
    };

    return (
        <div className="border border-gray-200 rounded-lg mb-4">
            <button
                className="flex justify-between items-center w-full p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none rounded-t-lg"
                onClick={toggleOpen}
            >
                <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                <svg
                    className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 p-4' : 'max-h-0 opacity-0'}`}
            >
                {isOpen && children}
            </div>
        </div>
    );
};

// Stepper Input Component for dynamic number adjustment
const StepperInput = ({ label, name, value, onChange, min, max }) => {
    const numericValue = parseInt(value, 10);
    const displayValue = isNaN(numericValue) ? min : Math.max(min, Math.min(max, numericValue));

    const handleStep = (step) => {
        const newValue = displayValue + step;
        if (newValue >= min && newValue <= max) {
            onChange({ target: { name, value: newValue.toString() } });
        }
    };

    const handleChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) {
            onChange({ target: { name, value: val } });
        }
    };

    const handleBlur = () => {
         if (isNaN(numericValue) || value === '') {
            onChange({ target: { name, value: min.toString() } });
        }
    }

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}:
            </label>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    disabled={displayValue <= min}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    -
                </button>
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-20 p-2 border border-gray-300 rounded-md shadow-sm text-center text-sm"
                />
                <button
                    type="button"
                    onClick={() => handleStep(1)}
                    disabled={displayValue >= max}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    +
                </button>
            </div>
        </div>
    );
};

// Component to render the user's custom script or the mock form
const FormPreview = ({ script }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clear previous content
        container.innerHTML = '';

        const effectiveScript = script || `
            <form class="custom-form-container" onsubmit="event.preventDefault()">
                <div class="form-group">
                    <label for="name">First Name</label>
                    <input type="text" id="name" placeholder="Enter your name" />
                </div>
                 <div class="form-group">
                    <label for="last-name">Last Name</label>
                    <input type="text" id="last-name" placeholder="Enter your last name" />
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" placeholder="Enter your phone number" />
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="Enter your email" />
                </div>
                <div class="form-group full-width-field">
                    <label for="message">Message</label>
                    <textarea id="message" rows="4" placeholder="Your message..."></textarea>
                </div>
                <div class="form-group full-width-field">
                    <input type="submit" class="btn btn-primary" value="Submit">
                </div>
            </form>
        `;

        // If there is a script, parse and inject it
        const template = document.createElement('template');
        template.innerHTML = effectiveScript;

        const scripts = template.content.querySelectorAll('script');
        
        // First, append the non-script HTML content
        container.appendChild(template.content);

        // Then, create and append new script elements to execute them
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                 newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            }
            container.appendChild(newScript);
        });

    }, [script]);

    return <div ref={containerRef} className="w-full h-full"></div>;
};


// Main App component
const App = () => {
    // State to hold all the form's styling data
    const [formData, setFormData] = useState({
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        borderStyle: 'solid',
        borderTopWidth: '0px',
        borderRightWidth: '0px',
        borderBottomWidth: '0px',
        borderLeftWidth: '0px',
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
        borderBottomRightRadius: '5px',
        borderBottomLeftRadius: '5px',
        paddingTop: '20px',
        paddingRight: '20px',
        paddingBottom: '20px',
        paddingLeft: '20px',
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        primaryColor: '#c82b1c',
        primaryFontColor: '#ffffff',
        boxShadowHOffset: '0px',
        boxShadowVOffset: '5px',
        boxShadowBlur: '15px',
        boxShadowSpread: '0px',
        boxShadowColor: '#00000033',
        inputBorderColor: '#cccccc',
        inputBorderTopWidth: '1px',
        inputBorderRightWidth: '1px',
        inputBorderBottomWidth: '1px',
        inputBorderLeftWidth: '1px',
        inputBorderStyle: 'solid',
        inputPaddingTop: '10px',
        inputPaddingRight: '10px',
        inputPaddingBottom: '10px',
        inputPaddingLeft: '10px',
        inputBorderTopLeftRadius: '3px',
        inputBorderTopRightRadius: '3px',
        inputBorderBottomRightRadius: '3px',
        inputBorderBottomLeftRadius: '3px',
        inputTextColor: '#333333',
        inputBackgroundColor: '#ffffff',
        labelColor: '#555555',
        inputFontSize: '16px',
        labelFontSize: '16px',
        fontFamily: 'Inter, sans-serif',
        formFieldColumns: '2', 
    });

    // State for generated CSS and modal visibility
    const [generatedCss, setGeneratedCss] = useState('');
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [copyMessage, setCopyMessage] = useState('');

    // States for AI features
    const [apiProvider, setApiProvider] = useState('gemini');
    const [userApiKey, setUserApiKey] = useState('');
    const [colorGenerationMethod, setColorGenerationMethod] = useState('mood');
    const [colorMood, setColorMood] = useState('');
    const [colorCode, setColorCode] = useState('');
    const [isGeneratingColors, setIsGeneratingColors] = useState(false);
    const [colorError, setColorError] = useState('');
    
    // Merged state for content generation
    const [contentPurpose, setContentPurpose] = useState('');
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [contentError, setContentError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);

    // State for custom user script
    const [scriptInput, setScriptInput] = useState('');
    const [activeScript, setActiveScript] = useState('');


    // State for responsive preview width and accordion management
    const [previewWidth, setPreviewWidth] = useState('100%');
    const [openAccordion, setOpenAccordion] = useState('custom-script');

    // --- AI-Powered Generation Functions ---

    // Generic function to call the selected AI API
    const callGenerativeAPI = async (prompt, responseSchema) => {
        let apiUrl = '';
        let headers = {};
        let payload = {};
        let modifiedPrompt = prompt;

        switch (apiProvider) {
            case 'openai':
                apiUrl = 'https://api.openai.com/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userApiKey}`
                };
                modifiedPrompt = `${prompt}. Respond ONLY with a valid JSON object that conforms to this schema: ${JSON.stringify(responseSchema)}`;
                payload = {
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: modifiedPrompt }],
                    response_format: { type: 'json_object' }
                };
                break;
            case 'claude':
                apiUrl = 'https://api.anthropic.com/v1/messages';
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': userApiKey,
                    'anthropic-version': '2023-06-01'
                };
                modifiedPrompt = `${prompt}. Respond ONLY with a valid JSON object that conforms to this schema: ${JSON.stringify(responseSchema)}. Do not include any other text or explanations.`;
                payload = {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 2048,
                    messages: [{ role: 'user', content: modifiedPrompt }]
                };
                break;
            case 'gemini':
            default:
                apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${userApiKey || ""}`;
                headers = { 'Content-Type': 'application/json' };
                payload = {
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema,
                    },
                };
                break;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error:", errorBody);
            throw new Error(`API call failed with status: ${response.status}. ${errorBody.error?.message || ''}`);
        }
        
        const result = await response.json();

        // Parse the response based on the provider's structure
        let jsonText;
        switch(apiProvider) {
            case 'openai':
                jsonText = result.choices[0].message.content;
                break;
            case 'claude':
                jsonText = result.content[0].text;
                break;
            case 'gemini':
            default:
                 if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts.length > 0) {
                    jsonText = result.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Invalid response structure from Gemini API.");
                }
                break;
        }
        
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON response:", jsonText);
            throw new Error("Failed to parse JSON response from API.");
        }
    };

    // AI: Unified function to generate a color palette
    const handleGenerateColors = async () => {
        let prompt;
        if (colorGenerationMethod === 'mood') {
            if (!colorMood) {
                setColorError("Please describe a mood for the palette.");
                return;
            }
            prompt = `Generate a harmonious and accessible color palette for a web form based on the following mood: "${colorMood}". Provide hex codes for a primary color (for buttons/accents), a primary font color (for buttons), a main background color, a label color, and an input field text color.`;
        } else { // 'code'
            if (!colorCode) {
                setColorError("Please enter a Color name, HEX or RGB color code.");
                return;
            }
            prompt = `Using the color "${colorCode}" (which could be a name, HEX, or RGB code) as the primary accent color, generate a harmonious and accessible color palette for a web form. Provide hex codes for the primary color itself, a suitable primary font color (for buttons), a main background color, a label color, and an input field text color.`;
        }
        
        setIsGeneratingColors(true);
        setColorError('');
        try {
            const schema = {
                type: "OBJECT",
                properties: {
                    primaryColor: { type: "STRING", description: "Accent color for buttons." },
                    primaryFontColor: { type: "STRING", description: "Text color for buttons." },
                    backgroundColor: { type: "STRING", description: "Form background color." },
                    labelColor: { type: "STRING", description: "Color for field labels." },
                    inputTextColor: { type: "STRING", description: "Color for text inside inputs." },
                },
                required: ["primaryColor", "primaryFontColor", "backgroundColor", "labelColor", "inputTextColor"]
            };
            const colors = await callGenerativeAPI(prompt, schema);
            setFormData(prev => ({ ...prev, ...colors }));
        } catch (error) {
            console.error("Color generation failed:", error);
            setColorError(`Sorry, I couldn't generate a palette. ${error.message}`);
        } finally {
            setIsGeneratingColors(false);
        }
    };


    // AI: Generate all form content (titles, button texts, field suggestions)
    const generateAllContent = async () => {
        if (!contentPurpose) {
            setContentError("Please describe the form's purpose.");
            return;
        }
        setIsGeneratingContent(true);
        setContentError('');
        setGeneratedContent(null);
        try {
            const prompt = `Generate creative and clear content suggestions for a web form. The form's purpose is: "${contentPurpose}". Provide 3 suggestions for the form's title and description. Provide 5 compelling call-to-action texts for the submit button. Provide 5 user-friendly suggestions for common form field labels or placeholders (like for name, email, or a specific question related to the purpose).`;
            const schema = {
                type: "OBJECT",
                properties: {
                    titles: {
                        type: "ARRAY",
                        description: "Suggestions for the form title and description.",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING" },
                                description: { type: "STRING" }
                            },
                            required: ["title", "description"]
                        }
                    },
                    buttonTexts: {
                        type: "ARRAY",
                         description: "Suggestions for the submit button's text.",
                        items: { type: "STRING" }
                    },
                    fieldSuggestions: {
                        type: "ARRAY",
                        description: "Suggestions for form field labels or placeholders.",
                        items: { type: "STRING" }
                    }
                },
                required: ["titles", "buttonTexts", "fieldSuggestions"]
            };
            const suggestions = await callGenerativeAPI(prompt, schema);
            setGeneratedContent(suggestions);
        } catch (error) {
            console.error("Content generation failed:", error);
            setContentError(`Sorry, I couldn't generate content. ${error.message}`);
        } finally {
            setIsGeneratingContent(false);
        }
    };

    // --- Core Application Logic ---

    // Function to show a temporary "toast" message for feedback
    const showCopyMessage = (message) => {
        setCopyMessage(message);
        setTimeout(() => {
            setCopyMessage('');
        }, 3000);
    };
    
    // Function to copy the generated CSS to the clipboard
    const copyToClipboard = () => {
        const textarea = document.createElement('textarea');
        textarea.value = generatedHtml;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showCopyMessage('Code copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy code: ', err);
            showCopyMessage('Failed to copy code.');
        }
        document.body.removeChild(textarea);
    };

    // Effect to generate and inject custom CSS into the document's head for live preview
    useEffect(() => {
        const injectCustomCss = () => {
            let styleTag = document.getElementById('custom-form-styles');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'custom-form-styles';
                document.head.appendChild(styleTag);
            }
            
            const boxShadowValue = `${formData.boxShadowHOffset} ${formData.boxShadowVOffset} ${formData.boxShadowBlur} ${formData.boxShadowSpread} ${formData.boxShadowColor}`;
            const columns = parseInt(formData.formFieldColumns, 10) || 1;

            const css = `
              /* Main wrapper for positioning and font */
              #form-widget-container {
                font-family: ${formData.fontFamily} !important;
                margin: ${formData.marginTop} ${formData.marginRight} ${formData.marginBottom} ${formData.marginLeft} !important;
                width: 100% !important;
              }

              /* The actual visible form container (custom script or placeholder) */
              #form-widget-container .form-widget.form-widget-2,
              #form-widget-container .custom-form-container {
                background-color: ${formData.backgroundColor} !important;
                border-color: ${formData.borderColor} !important;
                border-style: ${formData.borderStyle} !important;
                border-width: ${formData.borderTopWidth} ${formData.borderRightWidth} ${formData.borderBottomWidth} ${formData.borderLeftWidth} !important;
                border-radius: ${formData.borderTopLeftRadius} ${formData.borderTopRightRadius} ${formData.borderBottomRightRadius} ${formData.borderBottomLeftRadius} !important;
                padding: ${formData.paddingTop} ${formData.paddingRight} ${formData.paddingBottom} ${formData.paddingLeft} !important;
                box-shadow: ${boxShadowValue} !important;
                box-sizing: border-box !important;
                font-size: 0; /* Collapse whitespace for inline-block */
              }

              /* Mobile-first: Default to single column */
              #form-widget-container .form-group {
                  display: block !important;
                  width: 100% !important;
                  margin: 0 0 16px 0 !important;
                  padding: 0 4px !important;
                  box-sizing: border-box !important;
                  font-size: 1rem !important; /* Reset font size */
              }

              /* Desktop (768px and wider): Apply multi-column layout */
              @media (min-width: 768px) {
                  #form-widget-container .form-group:not(.full-width-field) {
                      display: inline-block !important;
                      vertical-align: top !important;
                      width: calc((100% / ${columns}) - 4px) !important; /* Dynamic width with margin buffer */
                      margin: 2px !important;
                  }
              }

              #form-widget-container .full-width-field {
                  width: 100% !important;
                  display: block !important;
              }

              #form-widget-container input:not([type="radio"]):not([type="checkbox"]):not([type="submit"]):not([type="button"]):not([type="color"]),
              #form-widget-container textarea,
              #form-widget-container select {
                width: 100% !important;
                border-width: ${formData.inputBorderTopWidth} ${formData.inputBorderRightWidth} ${formData.inputBorderBottomWidth} ${formData.inputBorderLeftWidth} !important;
                border-radius: ${formData.inputBorderTopLeftRadius} ${formData.inputBorderTopRightRadius} ${formData.inputBorderBottomRightRadius} ${formData.inputBorderBottomLeftRadius} !important;
                border-color: ${formData.inputBorderColor} !important;
                border-style: ${formData.inputBorderStyle} !important;
                color: ${formData.inputTextColor} !important;
                background-color: ${formData.inputBackgroundColor} !important;
                font-family: ${formData.fontFamily} !important;
                font-size: ${formData.inputFontSize} !important;
                padding: ${formData.inputPaddingTop} ${formData.inputPaddingRight} ${formData.inputPaddingBottom} ${formData.inputPaddingLeft} !important;
                box-sizing: border-box;
              }
              
              #form-widget-container label {
                 color: ${formData.labelColor} !important;
                 font-size: ${formData.labelFontSize} !important;
                 margin-bottom: 8px !important;
                 display: block;
              }

              #form-widget-container button,
              #form-widget-container input[type="submit"],
              #form-widget-container input.btn.btn-primary {
                background-color: ${formData.primaryColor} !important;
                color: ${formData.primaryFontColor} !important;
                border: none !important;
                padding: 12px 20px !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                font-size: ${formData.inputFontSize} !important;
                transition: background-color 0.3s ease !important;
                width: 100% !important;
                margin: 6px 0 !important;
                box-sizing: border-box;
              }
              
              #form-widget-container button:hover,
              #form-widget-container input[type="submit"]:hover,
              #form-widget-container input.btn.btn-primary:hover {
                filter: brightness(90%);
              }
            `;
            styleTag.innerHTML = css;
            setGeneratedCss(css);
        };
        
        injectCustomCss();
    }, [formData]);

    // Handler for all form styling input changes
    const handleStyleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };
    
    // Function to open the modal with the generated HTML
    const openCodeModal = () => {
        const formHtml = activeScript || `
            <form class="custom-form-container" onsubmit="event.preventDefault()">
                <div class="form-group">
                    <label for="name">First Name</label>
                    <input type="text" id="name" placeholder="Enter your name" />
                </div>
                 <div class="form-group">
                    <label for="last-name">Last Name</label>
                    <input type="text" id="last-name" placeholder="Enter your last name" />
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" placeholder="Enter your phone number" />
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="Enter your email" />
                </div>
                <div class="form-group full-width-field">
                    <label for="message">Message</label>
                    <textarea id="message" rows="4" placeholder="Your message..."></textarea>
                </div>
                <div class="form-group full-width-field">
                    <input type="submit" class="btn btn-primary" value="Submit">
                </div>
            </form>
        `;

        const codeSnippet = `<style>
${generatedCss}
</style>

<div id="form-widget-container">
${formHtml}
</div>`;
        setGeneratedHtml(codeSnippet);
        setShowCodeModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-inter text-gray-800 flex flex-col lg:flex-row gap-6">
            {/* Left Panel: Design Controls */}
            <div className="lg:w-1/3 bg-white p-6 rounded-lg shadow-lg overflow-y-auto max-h-[calc(100vh-32px)]">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Form Designer</h2>

                <Accordion id="custom-script" title="🔩 Custom Form Script" openAccordion={openAccordion} setOpenAccordion={setOpenAccordion}>
                    <p className="text-sm text-gray-600 mb-2">Paste your form's HTML or script tag below.</p>
                    <p className="text-xs text-gray-500 mb-3">For full-width elements (like textareas or submit buttons), wrap them in a container with <code className="bg-gray-200 px-1 rounded">class="full-width-field"</code>.</p>
                     <textarea
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-xs"
                        rows="6"
                        placeholder={`<form>
  <div class="form-group"><label>Name</label><input/></div>
  <div class="form-group"><label>Email</label><input/></div>
  <div class="form-group full-width-field">
    <input type="submit" class="btn btn-primary">
  </div>
</form>`}
                        value={scriptInput}
                        onChange={(e) => setScriptInput(e.target.value)}
                    />
                    <button onClick={() => setActiveScript(scriptInput)} className="mt-3 w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-indigo-700 transition-colors shadow disabled:opacity-50">
                        Apply Script
                    </button>
                </Accordion>

                <Accordion id="ai" title="✨ AI" openAccordion={openAccordion} setOpenAccordion={setOpenAccordion}>
                    {/* API Key Input */}
                    <div className="mb-6 border-b border-gray-200 pb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
                        <div className="flex gap-4 mb-2">
                           <label className="flex items-center">
                                <input type="radio" name="apiProvider" value="gemini" checked={apiProvider === 'gemini'} onChange={(e) => setApiProvider(e.target.value)} className="form-radio h-4 w-4 text-indigo-600"/>
                                <span className="ml-2 text-sm text-gray-700">Gemini</span>
                            </label>
                             <label className="flex items-center">
                                <input type="radio" name="apiProvider" value="openai" checked={apiProvider === 'openai'} onChange={(e) => setApiProvider(e.target.value)} className="form-radio h-4 w-4 text-indigo-600"/>
                                <span className="ml-2 text-sm text-gray-700">OpenAI</span>
                            </label>
                             <label className="flex items-center">
                                <input type="radio" name="apiProvider" value="claude" checked={apiProvider === 'claude'} onChange={(e) => setApiProvider(e.target.value)} className="form-radio h-4 w-4 text-indigo-600"/>
                                <span className="ml-2 text-sm text-gray-700">Claude</span>
                            </label>
                        </div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">Your AI API Key</label>
                        <input
                            type="password"
                            id="apiKey"
                            value={userApiKey}
                            onChange={(e) => setUserApiKey(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Paste your API key here"
                        />
                         <p className="text-xs text-gray-500 mt-1">Note: Ensure your key matches the selected provider.</p>
                    </div>

                    {/* Unified AI Color Generator */}
                    <div className="mb-6 border-b border-gray-200 pb-4">
                        <h4 className="text-md font-semibold text-purple-800 mb-2">AI Color Generator</h4>
                        <div className="flex gap-4 mb-3">
                            <label className="flex items-center">
                                <input type="radio" name="colorGenMethod" value="mood" checked={colorGenerationMethod === 'mood'} onChange={(e) => setColorGenerationMethod(e.target.value)} className="form-radio h-4 w-4 text-purple-600"/>
                                <span className="ml-2 text-sm text-gray-700">By Mood</span>
                            </label>
                            <label className="flex items-center">
                                <input type="radio" name="colorGenMethod" value="code" checked={colorGenerationMethod === 'code'} onChange={(e) => setColorGenerationMethod(e.target.value)} className="form-radio h-4 w-4 text-purple-600"/>
                                <span className="ml-2 text-sm text-gray-700">By Color Code</span>
                            </label>
                        </div>

                        {colorGenerationMethod === 'mood' ? (
                            <>
                                <p className="text-sm text-gray-600 mb-3">Describe a mood (e.g., 'calm and professional') to get a color palette.</p>
                                <textarea
                                    className="w-full p-2 border border-purple-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    rows="2"
                                    placeholder="e.g., 'vibrant and energetic'"
                                    value={colorMood}
                                    onChange={(e) => setColorMood(e.target.value)}
                                />
                            </>
                        ) : (
                             <>
                                <p className="text-sm text-gray-600 mb-3">Enter a Color name, HEX or RGB code to generate a matching palette.</p>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-purple-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    placeholder="e.g., red, #C82B1C, or rgb(200, 43, 28)"
                                    value={colorCode}
                                    onChange={(e) => setColorCode(e.target.value)}
                                />
                            </>
                        )}
                        
                        {colorError && <p className="text-red-600 text-sm mt-2">{colorError}</p>}
                        <button onClick={handleGenerateColors} disabled={isGeneratingColors} className="mt-3 w-full bg-purple-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-purple-700 transition-colors shadow disabled:opacity-50 flex items-center justify-center">
                            {isGeneratingColors ? <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg> : '✨ Generate Palette'}
                        </button>
                    </div>

                    {/* Merged AI Content Generator */}
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-blue-800 mb-2">AI Content Generator</h4>
                        <p className="text-sm text-gray-600 mb-3">Describe the form's purpose (e.g., 'event registration') to get ideas for titles, buttons, and fields.</p>
                        <textarea
                            className="w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            rows="2"
                            placeholder="e.g., 'contact form for a small business'"
                            value={contentPurpose}
                            onChange={(e) => setContentPurpose(e.target.value)}
                        />
                        {contentError && <p className="text-red-600 text-sm mt-2">{contentError}</p>}
                        <button onClick={generateAllContent} disabled={isGeneratingContent} className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors shadow disabled:opacity-50 flex items-center justify-center">
                            {isGeneratingContent ? <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg> : '✨ Generate All Content'}
                        </button>
                        {generatedContent && (
                            <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm space-y-4">
                                <div>
                                    <h5 className="font-bold text-gray-800">Title & Description Suggestions:</h5>
                                    {generatedContent.titles?.map((item, index) => (
                                        <div key={index} className="border-t pt-2 mt-2">
                                            <p className="font-semibold text-gray-700">{item.title}</p>
                                            <p className="text-gray-600">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-800">Button Text Suggestions:</h5>
                                    <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                                        {generatedContent.buttonTexts?.map((text, index) => <li key={index}>{text}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-800">Field Label/Placeholder Suggestions:</h5>
                                    <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                                        {generatedContent.fieldSuggestions?.map((text, index) => <li key={index}>{text}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </Accordion>

                <Accordion id="layout" title="Layout & Sizing" openAccordion={openAccordion} setOpenAccordion={setOpenAccordion}>
                    <StepperInput label="Form Field Columns" name="formFieldColumns" value={formData.formFieldColumns} onChange={handleStyleChange} min={1} max={4} />
                </Accordion>

                <Accordion id="container" title="Form Container" openAccordion={openAccordion} setOpenAccordion={setOpenAccordion}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Background</label>
                            <input type="color" name="backgroundColor" value={formData.backgroundColor} onChange={handleStyleChange} className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Border</label>
                            <input type="color" name="borderColor" value={formData.borderColor} onChange={handleStyleChange} className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer" />
                        </div>
                    </div>
                    <h4 className="text-md font-medium text-gray-700 mt-4">Border Width (px)</h4>
                     <div className="grid grid-cols-2 gap-x-4">
                        <RangeTextInput label="Top" name="borderTopWidth" value={formData.borderTopWidth} onChange={handleStyleChange} min="0" max="20" step="1" />
                        <RangeTextInput label="Right" name="borderRightWidth" value={formData.borderRightWidth} onChange={handleStyleChange} min="0" max="20" step="1" />
                        <RangeTextInput label="Bottom" name="borderBottomWidth" value={formData.borderBottomWidth} onChange={handleStyleChange} min="0" max="20" step="1" />
                        <RangeTextInput label="Left" name="borderLeftWidth" value={formData.borderLeftWidth} onChange={handleStyleChange} min="0" max="20" step="1" />
                    </div>
                </Accordion>
                
                <Accordion id="fields" title="Input Fields" openAccordion={openAccordion} setOpenAccordion={setOpenAccordion}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Field BG</label>
                            <input type="color" name="inputBackgroundColor" value={formData.inputBackgroundColor} onChange={handleStyleChange} className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Field Border</label>
                            <input type="color" name="inputBorderColor" value={formData.inputBorderColor} onChange={handleStyleChange} className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Field Text</label>
                            <input type="color" name="inputTextColor" value={formData.inputTextColor} onChange={handleStyleChange} className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Label Text</label>
                            <input type="color" name="labelColor" value={formData.labelColor} onChange={handleStyleChange} className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer" />
                        </div>
                    </div>
                    <RangeTextInput label="Field Font Size" name="inputFontSize" value={formData.inputFontSize} onChange={handleStyleChange} min="10" max="24" step="1" />
                    <RangeTextInput label="Label Font Size" name="labelFontSize" value={formData.labelFontSize} onChange={handleStyleChange} min="8" max="20" step="1" />
                </Accordion>

                <button onClick={openCodeModal} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-md font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md">
                    Get My Code
                </button>
            </div>

            {/* Right Panel: Live Form Preview */}
            <div className="lg:w-2/3 bg-gray-200 p-6 rounded-lg shadow-inner flex flex-col items-stretch">
                 <div className="w-full flex justify-center mb-4 gap-2">
                    <button onClick={() => setPreviewWidth('100%')} className="px-3 py-1 bg-white rounded shadow text-sm">Desktop</button>
                    <button onClick={() => setPreviewWidth('768px')} className="px-3 py-1 bg-white rounded shadow text-sm">Tablet</button>
                    <button onClick={() => setPreviewWidth('420px')} className="px-3 py-1 bg-white rounded shadow text-sm">Mobile</button>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-lg w-full flex-grow overflow-auto">
                    <div className="transition-all duration-300 ease-in-out" style={{ width: previewWidth }}>
                        <div id="form-widget-container" className="w-full">
                           <FormPreview script={activeScript} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full h-[90vh] flex flex-col">
                        <h3 className="text-2xl font-bold mb-2">Generated Code Snippet</h3>
                        <p className="text-sm text-gray-600 mb-4">Copy this snippet into your project's HTML where you want the form to appear.</p>
                        <textarea
                            readOnly
                            value={generatedHtml}
                            className="w-full flex-grow p-4 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-none"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={copyToClipboard} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                Copy Code
                            </button>
                            <button onClick={() => setShowCodeModal(false)} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Copy Message Toast */}
            {copyMessage && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg text-sm z-50 animate-pulse">
                    {copyMessage}
                </div>
            )}
        </div>
    );
};

export default App;
