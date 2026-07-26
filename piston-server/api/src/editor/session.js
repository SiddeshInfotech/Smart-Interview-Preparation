/**
 * Code Editor Session State & History Manager
 */

const { v4: uuidv4 } = require('uuid');

class EditorSessionManager {
    constructor() {
        this.sessions = new Map();
        // Session expiration TTL (24 hours)
        this.ttl = 24 * 60 * 60 * 1000;
    }

    createSession(data = {}) {
        const id = uuidv4();
        const session = {
            id,
            title: data.title || 'Untitled Session',
            language: data.language || 'python',
            code: data.code || '',
            files: data.files || [],
            stdin: data.stdin || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: []
        };
        this.sessions.set(id, session);
        return session;
    }

    getSession(id) {
        return this.sessions.get(id) || null;
    }

    updateSession(id, data = {}) {
        const session = this.sessions.get(id);
        if (!session) return null;

        if (data.title !== undefined) session.title = data.title;
        if (data.language !== undefined) session.language = data.language;
        if (data.code !== undefined) session.code = data.code;
        if (data.files !== undefined) session.files = data.files;
        if (data.stdin !== undefined) session.stdin = data.stdin;
        session.updatedAt = new Date().toISOString();

        return session;
    }

    addExecutionRecord(id, record) {
        const session = this.sessions.get(id);
        if (!session) return null;

        const historyEntry = {
            timestamp: new Date().toISOString(),
            status: record.status || 'executed',
            stdout: record.stdout || '',
            stderr: record.stderr || '',
            executionTime: record.execution_time || 0.0
        };

        session.history.unshift(historyEntry);

        // Keep last 20 execution runs
        if (session.history.length > 20) {
            session.history.pop();
        }

        session.updatedAt = new Date().toISOString();
        return historyEntry;
    }

    deleteSession(id) {
        return this.sessions.delete(id);
    }
}

const sessionManager = new EditorSessionManager();

module.exports = sessionManager;
