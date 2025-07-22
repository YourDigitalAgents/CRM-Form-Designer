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

    // State for custom user script
    const [scriptInput, setScriptInput] = useState('');
    const [activeScript, setActiveScript] = useState('');


    // State for responsive preview width and accordion management
    const [previewWidth, setPreviewWidth] = useState('100%');
    const [openAccordion, setOpenAccordion] = useState('custom-script');

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
