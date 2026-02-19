function setLang(lang) {
    document.body.className = 'lang-' + lang;
    document.getElementById('btn-am').classList.toggle('active', lang === 'am');
    document.getElementById('btn-om').classList.toggle('active', lang === 'om');
}

// Initialize default language
setLang('am');

// Expose setLang to window for HTML onclick handlers
window.setLang = setLang;

async function runAnalysis() {
    const form = document.getElementById('questionnaire-form');
    const formData = new FormData(form);
    const data = {};
    
    // Map radio and checkbox names to their values/checked status
    formData.forEach((value, key) => {
        data[key] = value;
    });

    // Handle checkboxes that are not in FormData when unchecked
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (!data[checkbox.name]) {
            data[checkbox.name] = "No";
        } else if (data[checkbox.name] === "on") {
            data[checkbox.name] = "Yes";
        }
    });

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
        alert('Please set your VITE_GEMINI_API_KEY in the .env file.');
        return;
    }

    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span lang="am">በመተንተን ላይ...</span><span lang="om">Qorachaa jira...</span>';

    try {
        const prompt = `Analyze the following ocular surface questionnaire results for a patient. 
        Provide a professional assessment of symptom severity, identify any "Alarm Features" (red flags), 
        and suggest generic care tips. Maintain a professional medical tone but include a disclaimer that this is an AI analysis and not a final diagnosis.
        
        Results:
        ${JSON.stringify(data, null, 2)}
        
        Output the analysis in Markdown format. Use the language of the questionnaire (Amharic for Amharic inputs, Oromo for Oromo inputs).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const result = await response.json();
        const analysis = result.candidates[0].content.parts[0].text;

        // Store analysis and original data for results page
        localStorage.setItem('ai_analysis', analysis);
        localStorage.setItem('form_data', JSON.stringify(data));

        window.location.href = 'results.html';
    } catch (error) {
        console.error('Error running analysis:', error);
        alert('Analysis failed. Check console for details.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

window.runAnalysis = runAnalysis;
