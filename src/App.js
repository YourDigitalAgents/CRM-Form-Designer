import React, { useState, useEffect, useCallback, useRef } from 'react';

// Reusable component for a color picker with text input
const ColorPicker = ({ label, name, value, onChange }) => (
    <div onMouseDown={(e) => e.stopPropagation()}>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <div className="flex items-center gap-2">
            <input 
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm font-mono"
            />
            <div className="relative w-8 h-8 flex-shrink-0">
                 <input 
                    type="color" 
                    name={name} 
                    value={value} 
                    onChange={onChange}
                    className="absolute inset-0 w-full h-full p-0 border-none rounded cursor-pointer opacity-0"
                />
                <div className="w-full h-full rounded border border-gray-300" style={{ backgroundColor: value }}></div>
            </div>
        </div>
    </div>
);

// Reusable component for a range slider
const RangeSlider = ({ label, name, value, onChange, min, max, step, unit = '' }) => (
    <div onMouseDown={(e) => e.stopPropagation()}>
        <label htmlFor={name} className="block text-xs font-medium text-gray-600">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="range"
                name={name}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-mono w-16 text-right">{value}{unit}</span>
        </div>
    </div>
);

// Component to render the user's custom script or the mock form
const FormPreview = React.memo(React.forwardRef(({ script, onElementClick, styles }, ref) => {
    const getInitialHtml = (scriptContent) => `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style id="form-styler-css"></style>
        </head>
        <body style="margin:0; font-family: 'Inter', sans-serif; background-color: transparent;">
            <div id="form-widget-container">
                ${scriptContent}
            </div>
            <script>
                window.addEventListener('message', function(event) {
                    if (event.data.type === 'styleUpdate') {
                        document.getElementById('form-styler-css').innerHTML = event.data.css;
                    }
                });

                const addEditingControls = () => {
                    const allElements = document.querySelectorAll('.form-widget-2, .custom-form-container, .form-group, .form-field, button, .btn, input[type="submit"]');
                    allElements.forEach((el, index) => {
                        if (el.querySelector('.element-edit-btn')) return;

                        el.style.position = 'relative';
                        const elementId = 'editable-' + index;
                        el.setAttribute('data-element-id', elementId);

                        const pencil = document.createElement('div');
                        pencil.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
                        pencil.className = 'element-edit-btn';
                        
                        pencil.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.parent.postMessage({ type: 'elementClick', id: elementId, rect: el.getBoundingClientRect() }, '*');
                        };
                        el.appendChild(pencil);

                        el.onmouseenter = (e) => { e.stopPropagation(); pencil.style.opacity = '1'; };
                        el.onmouseleave = (e) => { e.stopPropagation(); pencil.style.opacity = '0'; };
                    });
                };
                
                const ro = new ResizeObserver(entries => {
                    const height = document.body.scrollHeight;
                    window.parent.postMessage({ type: 'iframeResize', height: height }, '*');
                });
                ro.observe(document.body);

                const observer = new MutationObserver(addEditingControls);
                observer.observe(document.body, { childList: true, subtree: true });

                addEditingControls(); // Initial run
            <\/script>
        </body>
        </html>
    `;

    useEffect(() => {
        const iframe = ref.current;
        const userHtml = script || `
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
        iframe.srcdoc = getInitialHtml(userHtml);

        const handleMessage = (event) => {
            if (event.data.type === 'elementClick') {
                const { id, rect } = event.data;
                const element = iframe.contentDocument.querySelector(`[data-element-id="${id}"]`);
                onElementClick(element, id, rect);
            } else if (event.data.type === 'iframeResize') {
                if (iframe) {
                    iframe.style.height = `${event.data.height}px`;
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);

    }, [script, onElementClick, ref]);

    useEffect(() => {
        const iframe = ref.current;
        const sendStyles = () => {
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'styleUpdate', css: styles }, '*');
            }
        };
        const timeoutId = setTimeout(sendStyles, 100);
        return () => clearTimeout(timeoutId);
    }, [styles, ref]);

    return <iframe ref={ref} title="Form Preview" className="w-full border-0" style={{ minHeight: '500px' }}></iframe>;
}));


// Main App component
const App = () => {
    const [formData, setFormData] = useState({
        backgroundColor: '#ffffff',
        backgroundColorOpacity: 1,
        borderColor: '#000000',
        borderTopWidth: '0',
        borderRightWidth: '0',
        borderBottomWidth: '0',
        borderLeftWidth: '0',
        containerBorderTopLeftRadius: '5',
        containerBorderTopRightRadius: '5',
        containerBorderBottomRightRadius: '5',
        containerBorderBottomLeftRadius: '5',
        paddingTop: '20',
        paddingRight: '20',
        paddingBottom: '20',
        paddingLeft: '20',
        marginTop: '0',
        marginRight: '0',
        marginBottom: '0',
        marginLeft: '0',
        boxShadowColor: '#00000033',
        boxShadowHOffset: '0',
        boxShadowVOffset: '5',
        boxShadowBlur: '15',
        boxShadowSpread: '0',
        inputBackgroundColor: '#ffffff',
        inputBorderColor: '#cccccc',
        inputTextColor: '#333333',
        inputFontSize: '16',
        inputBorderTopLeftRadius: '3',
        inputBorderTopRightRadius: '3',
        inputBorderBottomRightRadius: '3',
        inputBorderBottomLeftRadius: '3',
        labelColor: '#555555',
        labelFontSize: '16',
        primaryColor: '#c82b1c',
        primaryFontColor: '#ffffff',
        buttonBorderColor: '#000000',
        buttonBorderTopWidth: '0',
        buttonBorderRightWidth: '0',
        buttonBorderBottomWidth: '0',
        buttonBorderLeftWidth: '0',
        buttonFontSize: '16',
        buttonFontWeight: 'normal',
        buttonBorderTopLeftRadius: '5',
        buttonBorderTopRightRadius: '5',
        buttonBorderBottomRightRadius: '5',
        buttonBorderBottomLeftRadius: '5',
        buttonPaddingTop: '12',
        buttonPaddingRight: '20',
        buttonPaddingBottom: '12',
        buttonPaddingLeft: '20',
        buttonMarginTop: '6',
        buttonMarginRight: '0',
        buttonMarginBottom: '6',
        buttonMarginLeft: '0',
        buttonBoxShadowColor: '#00000000',
        buttonBoxShadowHOffset: '0',
        buttonBoxShadowVOffset: '0',
        buttonBoxShadowBlur: '0',
        buttonBoxShadowSpread: '0',
        buttonTextAlign: 'center',
    });

    const [fieldLayouts, setFieldLayouts] = useState({});
    const [editingTarget, setEditingTarget] = useState(null);
    const [activePopupTab, setActivePopupTab] = useState('container');
    const [scriptInput, setScriptInput] = useState('');
    const [activeScript, setActiveScript] = useState('');
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [copyMessage, setCopyMessage] = useState('');
    const iframeRef = useRef(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleStyleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFieldLayoutChange = (id, sizePreset) => {
        setFieldLayouts(prev => ({ ...prev, [id]: sizePreset }));
    };
    
    const handleFiftyFifty = (id) => {
        const currentIndex = parseInt(id.split('-')[1], 10);
        const nextId = `editable-${currentIndex + 1}`;
        
        setFieldLayouts(prev => {
            const newLayouts = { ...prev };
            if (newLayouts[id] === 2.5) {
                delete newLayouts[id];
                delete newLayouts[nextId];
            } else {
                newLayouts[id] = 2.5;
                newLayouts[nextId] = 2.5;
            }
            return newLayouts;
        });
    };

    const handleElementClick = useCallback((element, id, rect) => {
        const previewPane = document.querySelector('.preview-pane');
        const previewRect = previewPane.getBoundingClientRect();

        let type = 'field';
        if (element.matches('.form-widget-2, .custom-form-container')) {
            type = 'container';
        } else if (element.matches('button, .btn, input[type="submit"]')) {
            type = 'button';
        }
        
        const top = rect.top + previewPane.scrollTop;
        const left = rect.right + previewPane.scrollLeft + 10;

        setEditingTarget({ id, type });
        setPopupPosition({ top, left });
    }, []);
    
    const generateCss = useCallback(() => {
        let layoutCss = '';
        const widthMap = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20, 2.5: 50 };

        for (const id in fieldLayouts) {
            const sizePreset = fieldLayouts[id];
            const widthPercentage = widthMap[sizePreset] || 100;
            layoutCss += `
              #form-widget-container [data-element-id="${id}"] {
                  width: ${widthPercentage}% !important;
              }
            `;
        }

        const hexToRgba = (hex, opacity) => {
            let c;
            if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
                c= hex.substring(1).split('');
                if(c.length === 3){ c= [c[0], c[0], c[1], c[1], c[2], c[2]]; }
                c= '0x'+c.join('');
                return `rgba(${[(c>>16)&255, (c>>8)&255, c&255].join(',')},${opacity})`;
            }
            return hex;
        }
        
        const bgColorWithOpacity = hexToRgba(formData.backgroundColor, formData.backgroundColorOpacity);

        return `
            #form-widget-container {
                margin: ${formData.marginTop}px ${formData.marginRight}px ${formData.marginBottom}px ${formData.marginLeft}px !important;
            }
            #form-widget-container .form-widget-2, #form-widget-container .custom-form-container {
                background-color: ${bgColorWithOpacity} !important;
                border-color: ${formData.borderColor} !important;
                border-style: solid !important;
                border-top-width: ${formData.borderTopWidth}px !important;
                border-right-width: ${formData.borderRightWidth}px !important;
                border-bottom-width: ${formData.borderBottomWidth}px !important;
                border-left-width: ${formData.borderLeftWidth}px !important;
                border-radius: ${formData.containerBorderTopLeftRadius}px ${formData.containerBorderTopRightRadius}px ${formData.containerBorderBottomRightRadius}px ${formData.containerBorderBottomLeftRadius}px !important;
                box-shadow: ${formData.boxShadowHOffset}px ${formData.boxShadowVOffset}px ${formData.boxShadowBlur}px ${formData.boxShadowSpread}px ${formData.boxShadowColor} !important;
                font-size: 0;
                padding: ${formData.paddingTop}px ${formData.paddingRight}px ${formData.paddingBottom}px ${formData.paddingLeft}px !important;
            }
            #form-widget-container .form-group, #form-widget-container .form-field {
                display: inline-block;
                vertical-align: top;
                width: 100%;
                font-size: 1rem;
                margin: 0 0 16px 0;
                padding: 0 4px;
                box-sizing: border-box;
            }
            ${layoutCss}
            #form-widget-container input, #form-widget-container textarea {
                background-color: ${formData.inputBackgroundColor} !important;
                border: 1px solid ${formData.inputBorderColor} !important;
                color: ${formData.inputTextColor} !important;
                font-size: ${formData.inputFontSize}px !important;
                width: 100%;
                padding: 10px;
                box-sizing: border-box;
                border-radius: ${formData.inputBorderTopLeftRadius}px ${formData.inputBorderTopRightRadius}px ${formData.inputBorderBottomRightRadius}px ${formData.inputBorderBottomLeftRadius}px !important;
            }
            #form-widget-container label { 
                color: ${formData.labelColor} !important; 
                font-size: ${formData.labelFontSize}px !important;
                display: block; 
                margin-bottom: 5px; 
            }
            #form-widget-container button, #form-widget-container .btn, #form-widget-container input[type="submit"] {
                background-color: ${formData.primaryColor} !important;
                color: ${formData.primaryFontColor} !important;
                border-color: ${formData.buttonBorderColor} !important;
                border-style: solid !important;
                border-top-width: ${formData.buttonBorderTopWidth}px !important;
                border-right-width: ${formData.buttonBorderRightWidth}px !important;
                border-bottom-width: ${formData.buttonBorderBottomWidth}px !important;
                border-left-width: ${formData.buttonBorderLeftWidth}px !important;
                border-radius: ${formData.buttonBorderTopLeftRadius}px ${formData.buttonBorderTopRightRadius}px ${formData.buttonBorderBottomRightRadius}px ${formData.buttonBorderBottomLeftRadius}px !important;
                padding: ${formData.buttonPaddingTop}px ${formData.buttonPaddingRight}px ${formData.buttonPaddingBottom}px ${formData.buttonPaddingLeft}px !important;
                margin: ${formData.buttonMarginTop}px ${formData.buttonMarginRight}px ${formData.buttonMarginBottom}px ${formData.buttonMarginLeft}px !important;
                box-shadow: ${formData.buttonBoxShadowHOffset}px ${formData.buttonBoxShadowVOffset}px ${formData.buttonBoxShadowBlur}px ${formData.buttonBoxShadowSpread}px ${formData.buttonBoxShadowColor} !important;
                text-align: ${formData.buttonTextAlign} !important;
                font-size: ${formData.buttonFontSize}px !important;
                font-weight: ${formData.buttonFontWeight} !important;
                cursor: pointer;
                width: 100%;
            }
            .element-edit-btn { display: none; }
        `;
    }, [formData, fieldLayouts]);

    const finalCss = generateCss();

    const openCodeModal = () => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;
        
        const previewContainer = iframe.contentWindow.document.querySelector('#form-widget-container');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = previewContainer.innerHTML;
        // Remove all pencil icons and data-attributes before generating the code
        tempDiv.querySelectorAll('.element-edit-btn').forEach(btn => btn.remove());
        tempDiv.querySelectorAll('[data-element-id]').forEach(el => el.removeAttribute('data-element-id'));
        const formHtml = tempDiv.innerHTML;

        const finalHtml = `<style>${generateCss()}</style>\n<div id="form-widget-container">${formHtml}</div>`;
        setGeneratedHtml(finalHtml);
        setShowCodeModal(true);
    };

    const showCopyMessage = (message) => {
        setCopyMessage(message);
        setTimeout(() => {
            setCopyMessage('');
        }, 3000);
    };

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

    const onDragStart = (e) => {
        setIsDragging(true);
        const popup = e.currentTarget.parentElement;
        const rect = popup.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const onDrag = useCallback((e) => {
        if (!isDragging) return;
        setPopupPosition({
            top: e.clientY - dragOffset.y,
            left: e.clientX - dragOffset.x,
        });
    }, [isDragging, dragOffset]);

    const onDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onDrag);
            window.addEventListener('mouseup', onDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', onDragEnd);
        };
    }, [isDragging, onDrag, onDragEnd]);

    const PopupAccordionItem = ({ title, id, children }) => {
        const isOpen = activePopupTab === id;
        return (
            <div className="border-b">
                <button onClick={() => setActivePopupTab(isOpen ? null : id)} className="w-full text-left p-2 font-semibold text-sm flex justify-between items-center">
                    <span>{title}</span>
                    <span>{isOpen ? '-' : '+'}</span>
                </button>
                {isOpen && <div className="p-2 space-y-4">{children}</div>}
            </div>
        )
    };

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
            <div className="min-h-screen bg-gray-100 p-4 font-inter text-gray-800 flex flex-col items-stretch">
                <div className="w-full max-w-6xl mx-auto flex flex-col flex-grow">
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                        <h2 className="text-xl font-bold mb-2">Custom Form Script</h2>
                        <textarea
                            className="w-full p-2 border border-gray-300 rounded-md font-mono text-xs"
                            rows="4"
                            placeholder="Paste your form script or HTML here..."
                            value={scriptInput}
                            onChange={(e) => setScriptInput(e.target.value)}
                        />
                        <button onClick={() => setActiveScript(scriptInput)} className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700">
                            Apply Script
                        </button>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-lg w-full flex-grow overflow-auto preview-pane">
                        <FormPreview ref={iframeRef} key={activeScript} script={activeScript} onElementClick={handleElementClick} styles={finalCss.replace('.element-edit-btn { display: none; }', `
            .element-edit-btn {
                width: 25px !important;
                height: 25px !important;
                background: white !important;
                color: black !important;
                border: 1px solid black !important;
                position: absolute; top: 2px; right: 2px; z-index: 10; opacity: 0; transition: opacity 0.2s; cursor: pointer; border-radius: 50%; padding: 4px; line-height: 1; display: flex; align-items: center; justify-content: center;
            }
             .element-edit-btn svg {
                stroke: black !important;
            }
        `)} />
                    </div>


                    <button onClick={openCodeModal} className="mt-4 w-full bg-blue-600 text-white py-3 rounded-md font-semibold text-lg hover:bg-blue-700 shadow-md">
                        Get My Code
                    </button>
                </div>

                {editingTarget && (
                    <div 
                        className="fixed bg-white shadow-xl rounded-lg z-20 w-72 flex flex-col"
                        style={{ top: popupPosition.top, left: popupPosition.left, resize: 'both', overflow: 'hidden', minWidth: '288px', minHeight: '300px', maxHeight: '90vh' }}
                    >
                        <div onMouseDown={onDragStart} className="p-2 border-b flex justify-between items-center cursor-move">
                            <h4 className="text-sm font-bold capitalize">{editingTarget.type} Settings</h4>
                            <button onClick={() => setEditingTarget(null)} className="text-gray-500 hover:text-red-500 text-xl">&times;</button>
                        </div>
                        
                        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar" onMouseDown={(e) => e.stopPropagation()}>
                            {editingTarget.type === 'container' && (
                                <div className="p-2">
                                    <PopupAccordionItem title="Container" id="container">
                                        <div className="space-y-4">
                                            <ColorPicker label="Background" name="backgroundColor" value={formData.backgroundColor} onChange={handleStyleChange} />
                                            <RangeSlider label="Opacity" name="backgroundColorOpacity" value={formData.backgroundColorOpacity} onChange={handleStyleChange} min="0" max="1" step="0.05" />
                                            <hr/>
                                            <p className="text-sm font-semibold">Border</p>
                                            <ColorPicker label="Color" name="borderColor" value={formData.borderColor} onChange={handleStyleChange} />
                                            <RangeSlider label="Top" name="borderTopWidth" value={formData.borderTopWidth} onChange={handleStyleChange} min="0" max="20" step="1" unit="px" />
                                            <RangeSlider label="Right" name="borderRightWidth" value={formData.borderRightWidth} onChange={handleStyleChange} min="0" max="20" step="1" unit="px" />
                                            <RangeSlider label="Bottom" name="borderBottomWidth" value={formData.borderBottomWidth} onChange={handleStyleChange} min="0" max="20" step="1" unit="px" />
                                            <RangeSlider label="Left" name="borderLeftWidth" value={formData.borderLeftWidth} onChange={handleStyleChange} min="0" max="20" step="1" unit="px" />
                                            <hr/>
                                            <p className="text-sm font-semibold">Border Radius</p>
                                            <RangeSlider label="Top Left" name="containerBorderTopLeftRadius" value={formData.containerBorderTopLeftRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Top Right" name="containerBorderTopRightRadius" value={formData.containerBorderTopRightRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Bottom Right" name="containerBorderBottomRightRadius" value={formData.containerBorderBottomRightRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Bottom Left" name="containerBorderBottomLeftRadius" value={formData.containerBorderBottomLeftRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <hr/>
                                            <p className="text-sm font-semibold">Box Shadow</p>
                                            <ColorPicker label="Color" name="boxShadowColor" value={formData.boxShadowColor} onChange={handleStyleChange} />
                                            <RangeSlider label="H-Offset" name="boxShadowHOffset" value={formData.boxShadowHOffset} onChange={handleStyleChange} min="-20" max="20" step="1" unit="px" />
                                            <RangeSlider label="V-Offset" name="boxShadowVOffset" value={formData.boxShadowVOffset} onChange={handleStyleChange} min="-20" max="20" step="1" unit="px" />
                                            <RangeSlider label="Blur" name="boxShadowBlur" value={formData.boxShadowBlur} onChange={handleStyleChange} min="0" max="40" step="1" unit="px" />
                                            <RangeSlider label="Spread" name="boxShadowSpread" value={formData.boxShadowSpread} onChange={handleStyleChange} min="-20" max="20" step="1" unit="px" />
                                        </div>
                                    </PopupAccordionItem>
                                    <PopupAccordionItem title="Spacing" id="spacing">
                                        <div className="space-y-4">
                                            <p className="text-sm font-semibold">Padding</p>
                                            <RangeSlider label="Top" name="paddingTop" value={formData.paddingTop} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Right" name="paddingRight" value={formData.paddingRight} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Bottom" name="paddingBottom" value={formData.paddingBottom} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Left" name="paddingLeft" value={formData.paddingLeft} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <hr/>
                                            <p className="text-sm font-semibold">Margin</p>
                                            <RangeSlider label="Top" name="marginTop" value={formData.marginTop} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Right" name="marginRight" value={formData.marginRight} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Bottom" name="marginBottom" value={formData.marginBottom} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Left" name="marginLeft" value={formData.marginLeft} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                        </div>
                                    </PopupAccordionItem>
                                     <PopupAccordionItem title="Labels" id="labels">
                                        <div className="space-y-4">
                                            <ColorPicker label="Text Color" name="labelColor" value={formData.labelColor} onChange={handleStyleChange} />
                                            <RangeSlider label="Font Size" name="labelFontSize" value={formData.labelFontSize} onChange={handleStyleChange} min="8" max="24" step="1" unit="px" />
                                        </div>
                                    </PopupAccordionItem>
                                     <PopupAccordionItem title="Inputs" id="inputs">
                                        <div className="space-y-4">
                                            <ColorPicker label="Background" name="inputBackgroundColor" value={formData.inputBackgroundColor} onChange={handleStyleChange} />
                                            <ColorPicker label="Border" name="inputBorderColor" value={formData.inputBorderColor} onChange={handleStyleChange} />
                                            <ColorPicker label="Text" name="inputTextColor" value={formData.inputTextColor} onChange={handleStyleChange} />
                                            <RangeSlider label="Font Size" name="inputFontSize" value={formData.inputFontSize} onChange={handleStyleChange} min="8" max="24" step="1" unit="px" />
                                             <hr/>
                                            <p className="text-sm font-semibold">Border Radius</p>
                                            <RangeSlider label="Top Left" name="inputBorderTopLeftRadius" value={formData.inputBorderTopLeftRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Top Right" name="inputBorderTopRightRadius" value={formData.inputBorderTopRightRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Bottom Right" name="inputBorderBottomRightRadius" value={formData.inputBorderBottomRightRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                            <RangeSlider label="Bottom Left" name="inputBorderBottomLeftRadius" value={formData.inputBorderBottomLeftRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                        </div>
                                    </PopupAccordionItem>
                                </div>
                            )}

                            {editingTarget.type === 'field' && (
                                <div className="p-2">
                                    <p className="text-sm font-bold text-center mb-2">Field Width</p>
                                    <div className="grid grid-cols-3 gap-1">
                                        {[1, 2, 3, 4, 5].map(size => (
                                            <button 
                                                key={size}
                                                onClick={() => handleFieldLayoutChange(editingTarget.id, size)}
                                                className="text-xs px-2 py-1 bg-gray-200 hover:bg-indigo-500 hover:text-white rounded"
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => handleFiftyFifty(editingTarget.id)} className="mt-2 w-full text-xs px-2 py-1 bg-green-200 hover:bg-green-500 hover:text-white rounded">50:50</button>
                                </div>
                            )}

                            {editingTarget.type === 'button' && (
                                 <div className="space-y-4 p-2">
                                    <ColorPicker label="Background" name="primaryColor" value={formData.primaryColor} onChange={handleStyleChange} />
                                    <ColorPicker label="Text Color" name="primaryFontColor" value={formData.primaryFontColor} onChange={handleStyleChange} />
                                    <RangeSlider label="Font Size" name="buttonFontSize" value={formData.buttonFontSize} onChange={handleStyleChange} min="8" max="24" step="1" unit="px" />
                                     <div>
                                        <label className="block text-xs font-medium text-gray-600">Font Weight</label>
                                        <select name="buttonFontWeight" value={formData.buttonFontWeight} onChange={handleStyleChange} className="w-full p-2 mt-1 border rounded text-sm">
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                        </select>
                                    </div>
                                    <hr/>
                                    <p className="text-sm font-semibold">Border</p>
                                    <ColorPicker label="Color" name="buttonBorderColor" value={formData.buttonBorderColor} onChange={handleStyleChange} />
                                    <RangeSlider label="Top" name="buttonBorderTopWidth" value={formData.buttonBorderTopWidth} onChange={handleStyleChange} min="0" max="20" step="1" unit="px" />
                                    <RangeSlider label="Right" name="buttonBorderRightWidth" value={formData.buttonBorderRightWidth} onChange={handleStyleChange} min="0" max="20" step="1" unit="px" />
                                    <RangeSlider label="Bottom" name="buttonBorderBottomWidth" value={formData.buttonBorderBottomWidth} onChange={handleStyleChange} min="0" max="20" step="1" unit="px" />
                                    <RangeSlider label="Left" name="buttonBorderLeftWidth" value={formData.buttonBorderLeftWidth} onChange={handleStyleChange} min="0" max="20" step="1" unit="px" />
                                    <hr/>
                                    <p className="text-sm font-semibold">Border Radius</p>
                                    <RangeSlider label="Top Left" name="buttonBorderTopLeftRadius" value={formData.buttonBorderTopLeftRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                    <RangeSlider label="Top Right" name="buttonBorderTopRightRadius" value={formData.buttonBorderTopRightRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                    <RangeSlider label="Bottom Right" name="buttonBorderBottomRightRadius" value={formData.buttonBorderBottomRightRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                    <RangeSlider label="Bottom Left" name="buttonBorderBottomLeftRadius" value={formData.buttonBorderBottomLeftRadius} onChange={handleStyleChange} min="0" max="50" step="1" unit="px" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

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

                {copyMessage && (
                    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg text-sm z-50 animate-pulse">
                        {copyMessage}
                    </div>
                )}
            </div>
        </>
    );
};

export default App;
