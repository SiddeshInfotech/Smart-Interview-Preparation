const express = require('express');
const router = express.Router();

const { getTemplate, getAllTemplates } = require('../editor/templates');
const { lintCode } = require('../editor/linter');
const { formatCode } = require('../editor/formatter');
const { analyzeCode } = require('../editor/analyzer');
const sessionManager = require('../editor/session');
const { getEditorConfig } = require('../editor/config');

// 1. GET /api/v2/editor/config - Get Editor Configuration Specs
router.get('/config', (req, res) => {
    const lang = req.query.language;
    const config = getEditorConfig(lang);
    return res.status(200).json({
        success: true,
        config
    });
});

// 2. GET /api/v2/editor/templates - List all supported code templates
router.get('/templates', (req, res) => {
    const templates = getAllTemplates();
    return res.status(200).json({
        success: true,
        templates
    });
});

// GET /api/v2/editor/templates/:language - Get starter template for a specific language
router.get('/templates/:language', (req, res) => {
    const { language } = req.params;
    const template = getTemplate(language);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: `No starter code template found for language '${language}'`
        });
    }

    return res.status(200).json({
        success: true,
        template
    });
});

// 3. POST /api/v2/editor/lint - Perform static syntax validation & linting
router.post('/lint', (req, res) => {
    const { code, language } = req.body;

    if (code === undefined || typeof code !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'code is required as a string'
        });
    }

    const lintResult = lintCode(code, language || 'python');
    return res.status(200).json({
        success: true,
        lint: lintResult
    });
});

// 4. POST /api/v2/editor/format - Format and beautify code
router.post('/format', (req, res) => {
    const { code, language, options } = req.body;

    if (code === undefined || typeof code !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'code is required as a string'
        });
    }

    const formatResult = formatCode(code, language || 'javascript', options || {});
    return res.status(200).json({
        success: true,
        ...formatResult
    });
});

// 5. POST /api/v2/editor/analyze - Perform code metrics analysis
router.post('/analyze', (req, res) => {
    const { code, language } = req.body;

    if (code === undefined || typeof code !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'code is required as a string'
        });
    }

    const metrics = analyzeCode(code, language || 'python');
    return res.status(200).json({
        success: true,
        analysis: metrics
    });
});

// 6. POST /api/v2/editor/session - Create a new editor workspace session
router.post('/session', (req, res) => {
    const session = sessionManager.createSession(req.body || {});
    return res.status(201).json({
        success: true,
        session
    });
});

// GET /api/v2/editor/session/:sessionId - Retrieve an existing session
router.get('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.status(404).json({
            success: false,
            message: `Editor session '${sessionId}' not found`
        });
    }

    return res.status(200).json({
        success: true,
        session
    });
});

// PUT /api/v2/editor/session/:sessionId - Update an existing session draft
router.put('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessionManager.updateSession(sessionId, req.body || {});

    if (!session) {
        return res.status(404).json({
            success: false,
            message: `Editor session '${sessionId}' not found`
        });
    }

    return res.status(200).json({
        success: true,
        session
    });
});

// DELETE /api/v2/editor/session/:sessionId - Delete an editor session
router.delete('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const deleted = sessionManager.deleteSession(sessionId);

    if (!deleted) {
        return res.status(404).json({
            success: false,
            message: `Editor session '${sessionId}' not found`
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Session deleted successfully'
    });
});

module.exports = router;
