import api from "./axios";

/**
 * Execute source code via backend Piston API compiler service
 * @param {string} language - Programming language (python, c, cpp, java, javascript)
 * @param {string} code - Source code text
 * @param {string} stdin - Standard input string
 */
export const executeCompilerCode = async (language, code, stdin = "") => {
    try {
        const response = await api.post("/compiler/execute/", {
            language,
            code,
            stdin
        });
        return response.data;
    } catch (error) {
        console.error("Compiler execution error:", error);
        throw error;
    }
};

/**
 * Fetch execution history for the authenticated user
 */
export const getCompilerHistory = async () => {
    try {
        const response = await api.get("/compiler/history/");
        return response.data;
    } catch (error) {
        console.error("Compiler history fetch error:", error);
        throw error;
    }
};

/**
 * Fetch supported language runtimes
 */
export const getCompilerRuntimes = async () => {
    try {
        const response = await api.get("/compiler/runtimes/");
        return response.data;
    } catch (error) {
        console.error("Compiler runtimes fetch error:", error);
        throw error;
    }
};
