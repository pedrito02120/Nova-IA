// ============================================================
// NOVA IA
// Backend principal
// Creada por Yander
// ============================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURACIÓN
// ============================================================

app.use(cors());

app.use(
    express.json({
        limit: "5mb"
    })
);

// ============================================================
// PROVEEDORES
// ============================================================

const PROVIDERS = {
    groq: {
        name: "Groq",
        model: "openai/gpt-oss-120b",
        env: "GROQ_API_KEY"
    },

    gemini: {
        name: "Gemini",
        model: "gemini-3.8-flash",
        env: "GEMINI_API_KEY"
    },

    openrouter: {
        name: "OpenRouter",
        model: "openrouter/free",
        env: "OPENROUTER_API_KEY"
    }
};

// ============================================================
// RUTAS
// ============================================================

const publicPath = path.join(__dirname, "public");

const memoryPath = path.join(
    __dirname,
    "conversaciones.json"
);

// ============================================================
// MEMORIA
// ============================================================

function loadMemory() {
    try {
        if (!fs.existsSync(memoryPath)) {
            fs.writeFileSync(
                memoryPath,
                JSON.stringify([], null, 2),
                "utf8"
            );

            return [];
        }

        const raw = fs.readFileSync(memoryPath, "utf8");

        if (!raw.trim()) {
            return [];
        }

        const parsed = JSON.parse(raw);

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {
        console.error(
            "Error cargando memoria:",
            error?.message || error
        );

        return [];
    }
}

function saveMemory(memory) {
    try {
        fs.writeFileSync(
            memoryPath,
            JSON.stringify(memory, null, 2),
            "utf8"
        );

        return true;

    } catch (error) {
        console.error(
            "Error guardando memoria:",
            error?.message || error
        );

        return false;
    }
}

let conversationMemory = loadMemory();

// ============================================================
// DETECCIÓN DEL DISPOSITIVO
// ============================================================

function detectDevice(req) {
    const userAgent = String(
        req.headers["user-agent"] || ""
    ).toLowerCase();

    const isTablet =
        /ipad|tablet|kindle|silk|playbook/i.test(userAgent);

    const isMobile =
        /android|iphone|ipod|mobile|windows phone/i.test(userAgent);

    let type = "PC";

    if (isTablet) {
        type = "TABLET";
    } else if (isMobile) {
        type = "MOBILE";
    }

    let operatingSystem = "UNKNOWN";

    if (/android/i.test(userAgent)) {
        operatingSystem = "ANDROID";
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        operatingSystem = "IOS";
    } else if (/windows/i.test(userAgent)) {
        operatingSystem = "WINDOWS";
    } else if (/macintosh|mac os/i.test(userAgent)) {
        operatingSystem = "MACOS";
    } else if (/linux/i.test(userAgent)) {
        operatingSystem = "LINUX";
    }

    const inputMethod =
        type === "MOBILE" || type === "TABLET"
            ? "TOUCH"
            : "MOUSE_KEYBOARD";

    return {
        type,
        operatingSystem,
        inputMethod
    };
}

// ============================================================
// SYSTEM PROMPT
// NOVA IA — ESPECIALIZADA EN LUA PARA DELTA
// ============================================================

const SYSTEM_PROMPT = `
============================================================
IDENTIDAD
============================================================

Eres NOVA IA.

Tu creador es Yander.

Tu especialidad principal es LUA PARA ROBLOX
EJECUTADO MEDIANTE DELTA EXECUTOR.

Cuando el usuario diga Delta, executor, ejecutor,
script Lua, loadstring, hub o GUI para executor,
interpreta que solicita código para un entorno
de ejecución Lua tipo Delta.

============================================================
DELTA NO ES ROBLOX STUDIO
============================================================

DELTA EXECUTOR:

El código se ejecuta como script Lua dentro del cliente
de Roblox mediante un entorno de ejecución.

ROBLOX STUDIO:

Es el entorno de desarrollo donde existen objetos como
StarterGui, StarterPlayer, ServerScriptService,
ReplicatedStorage y Workspace.

No conviertas automáticamente un script de Delta
en uno para Roblox Studio.

Si el usuario pide un script para Delta, no generes
automáticamente instrucciones para colocar el código
en StarterPlayerScripts, ServerScriptService,
ModuleScript u otros objetos de Studio,
salvo que lo solicite expresamente.

============================================================
REGLA DE CÓDIGO
============================================================

Cuando el usuario solicite un script:

- Devuelve el código completo.
- No uses pseudocódigo.
- No omitas funciones.
- No uses puntos suspensivos para sustituir código.
- No inventes APIs.
- No generes botones sin funcionalidad.
- No entregues sistemas ficticios.

Cuando el usuario solicite modificar un script,
conserva las características que funcionan y devuelve
el código completo modificado.

============================================================
CONFIGURACIÓN
============================================================

Cuando se solicite un sistema configurable,
utiliza una configuración central.

Cada opción debe estar conectada a la lógica real.

No crees configuraciones decorativas.

============================================================
GUI PROFESIONAL
============================================================

Si el usuario solicita una GUI, debe ser funcional.

Puedes utilizar ScreenGui, Frame, TextLabel,
TextButton, ImageLabel, ImageButton, ScrollingFrame,
UICorner, UIStroke, UIGradient, UIPadding,
UIListLayout, UIGridLayout y TweenService.

Prioriza buena jerarquía visual, espaciado,
controles claros y compatibilidad táctil.

============================================================
TOGGLES, SLIDERS Y DROPDOWNS
============================================================

Cada toggle debe controlar una característica real.

Los sliders deben tener mínimo, máximo, valor visible,
validación numérica y conexión con la lógica real.

Los dropdowns deben modificar valores reales.

Si el usuario solicita RGB, utiliza un sistema real
basado en Color3.fromHSV().

Si solicita animaciones, utiliza TweenService
e implementa realmente las acciones solicitadas.

============================================================
MÓVIL Y PC
============================================================

Adapta la interfaz al entorno solicitado.

En móvil considera controles táctiles grandes,
scrolling y ausencia de teclado físico.

En PC puedes utilizar mouse, teclado y combinaciones
de teclas cuando corresponda.

No copies literalmente la detección del dispositivo
del backend dentro del script Lua.

============================================================
ESTABILIDAD Y RENDIMIENTO
============================================================

Cuando corresponda:

- Valida CurrentCamera.
- Gestiona respawn y cambios de personaje.
- Limpia referencias de jugadores que abandonan.
- Evita duplicar GUI, conexiones y loops.
- Limpia los sistemas al cerrar la interfaz.
- Evita conexiones innecesarias.
- Evita crear objetos constantemente.
- Comprueba las funciones y servicios utilizados.
- No inventes APIs del entorno de ejecución.

============================================================
REVISIÓN FINAL
============================================================

Antes de entregar el código, comprueba:

- Sintaxis válida.
- Variables y funciones existentes.
- Servicios y eventos correctos.
- Configuraciones conectadas.
- Controles funcionales.
- Limpieza y rendimiento.
- Compatibilidad con el entorno solicitado.
- Código completo, sin pseudocódigo.

============================================================
OBJETIVO
============================================================

NOVA IA debe entender, analizar, diseñar,
implementar, revisar y corregir.

Prioriza código completo, lógica real,
estabilidad, compatibilidad y mantenimiento.

No simplemente produzcas código largo.
`;

// ============================================================
// CONTEXTO DEL DISPOSITIVO
// ============================================================

function createDeviceContext(device) {
    return `
============================================================
CONTEXTO DEL CLIENTE
============================================================

DISPOSITIVO: ${device.type}
SISTEMA: ${device.operatingSystem}
ENTRADA: ${device.inputMethod}

Este contexto sirve para adaptar la interfaz y los controles.
No copies literalmente estos valores dentro del script.

Si el código necesita detectar entrada dentro de Roblox,
utiliza APIs reales del entorno.

============================================================
`;
}

// ============================================================
// LIMPIAR HISTORIAL
// ============================================================

function sanitizeHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter(item => {
            if (!item) return false;

            if (
                item.role !== "user" &&
                item.role !== "assistant" &&
                item.role !== "ai"
            ) {
                return false;
            }

            return (
                typeof item.content === "string" &&
                item.content.trim().length > 0
            );
        })
        .slice(-20)
        .map(item => ({
            role:
                item.role === "ai"
                    ? "assistant"
                    : item.role,

            content: item.content.slice(0, 30000)
        }));
}

// ============================================================
// CONSTRUIR MENSAJES
// ============================================================

function buildMessages(userMessage, history, device) {
    const messages = [
        {
            role: "system",
            content:
                SYSTEM_PROMPT +
                "\n\n" +
                createDeviceContext(device)
        }
    ];

    let cleanHistory = sanitizeHistory(history);

    const lastMessage =
        cleanHistory[cleanHistory.length - 1];

    if (
        lastMessage &&
        lastMessage.role === "user" &&
        lastMessage.content.trim() === userMessage.trim()
    ) {
        cleanHistory = cleanHistory.slice(0, -1);
    }

    for (const item of cleanHistory) {
        messages.push({
            role: item.role,
            content: item.content
        });
    }

    messages.push({
        role: "user",
        content: userMessage
    });

    return messages;
}

// ============================================================
// UTILIDAD FETCH
// ============================================================

async function fetchJson(url, options, providerName) {
    const response = await fetch(url, options);
    const text = await response.text();

    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }

    if (!response.ok) {
        const apiError = data?.error;

        const message =
            typeof apiError === "string"
                ? apiError
                : apiError?.message ||
                  data?.message ||
                  text ||
                  `Error HTTP ${response.status}`;

        const error = new Error(message);

        error.status = response.status;
        error.provider = providerName;
        error.raw = data;

        throw error;
    }

    return data;
}

// ============================================================
// GROQ
// ============================================================

async function askGroq(messages) {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GROQ_API_KEY no está configurada en Render."
        );
    }

    const data = await fetchJson(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },

            body: JSON.stringify({
                model: PROVIDERS.groq.model,
                messages,
                max_tokens: 16000,
                temperature: 0.7
            })
        },
        "Groq"
    );

    const answer =
        data?.choices?.[0]?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("Groq respondió sin contenido.");
    }

    return answer;
}

// ============================================================
// GEMINI
// ============================================================

async function askGemini(messages) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY no está configurada en Render."
        );
    }

    const systemMessage = messages.find(
        item => item.role === "system"
    );

    const history = messages.filter(
        item => item.role !== "system"
    );

    const contents = history.map(item => ({
        role: item.role === "assistant" ? "model" : "user",

        parts: [
            {
                text: item.content
            }
        ]
    }));

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${PROVIDERS.gemini.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const data = await fetchJson(
        url,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: systemMessage?.content || ""
                        }
                    ]
                },

                contents,

                generationConfig: {
                    maxOutputTokens: 16000,
                    temperature: 0.7
                }
            })
        },
        "Gemini"
    );

    const answer =
        data?.candidates?.[0]?.content?.parts
            ?.map(part => part?.text || "")
            .join("");

    if (typeof answer !== "string" || !answer.trim()) {
        const reason =
            data?.promptFeedback?.blockReason;

        throw new Error(
            reason
                ? `Gemini no generó una respuesta. Motivo: ${reason}`
                : "Gemini respondió sin contenido."
        );
    }

    return answer;
}

// ============================================================
// OPENROUTER
// ============================================================

async function askOpenRouter(messages) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error(
            "OPENROUTER_API_KEY no está configurada en Render."
        );
    }

    const data = await fetchJson(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://nova-ia-2oup.onrender.com",
                "X-Title": "NOVA IA"
            },

            body: JSON.stringify({
                model: PROVIDERS.openrouter.model,
                messages,
                max_tokens: 16000,
                temperature: 0.7
            })
        },
        "OpenRouter"
    );

    const answer =
        data?.choices?.[0]?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
        throw new Error(
            "OpenRouter respondió sin contenido."
        );
    }

    return answer;
}

// ============================================================
// SELECCIONAR PROVEEDOR
// ============================================================

async function askProvider(provider, messages) {
    switch (provider) {
        case "groq":
            return await askGroq(messages);

        case "gemini":
            return await askGemini(messages);

        case "openrouter":
            return await askOpenRouter(messages);

        default:
            throw new Error(
                `Proveedor no válido: ${provider}`
            );
    }
}

// ============================================================
// DETECTAR MODELO GEMINI NO DISPONIBLE
// ============================================================

function isGeminiModelUnavailable(error) {
    const message = String(error?.message || "").toLowerCase();

    return (
        Number(error?.status) === 404 &&
        (
            message.includes("no longer available") ||
            message.includes("not found") ||
            message.includes("not supported") ||
            message.includes("is not found") ||
            message.includes("models/gemini")
        )
    );
}

// ============================================================
// ERROR SEGURO
// ============================================================

function getSafeErrorMessage(error) {
    if (!error) {
        return "Error desconocido.";
    }

    const status = error?.status
        ? `HTTP ${error.status}`
        : "";

    const code = error?.code
        ? `Código: ${error.code}`
        : "";

    let message =
        error?.message || "Error desconocido.";

    if (message.length > 1000) {
        message = message.slice(0, 1000) + "...";
    }

    if (status && code) {
        return `${status} | ${code} | ${message}`;
    }

    if (status) {
        return `${status} | ${message}`;
    }

    if (code) {
        return `${code} | ${message}`;
    }

    return message;
}

// ============================================================
// PROCESAR CHAT
// ============================================================

async function processChat(req, res) {
    try {
        const body = req.body || {};

        const message =
            typeof body.message === "string"
                ? body.message.trim()
                : "";

        const history = body.history;

        let provider =
            typeof body.provider === "string"
                ? body.provider.toLowerCase().trim()
                : "groq";

        if (!PROVIDERS[provider]) {
            provider = "groq";
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                error: "El mensaje está vacío."
            });
        }

        if (message.length > 30000) {
            return res.status(400).json({
                success: false,
                error: "El mensaje es demasiado largo."
            });
        }

        const providerConfig = PROVIDERS[provider];

        if (!process.env[providerConfig.env]) {
            return res.status(500).json({
                success: false,
                error:
                    `${providerConfig.env} no está configurada en Render.`
            });
        }

        const device = detectDevice(req);

        console.log("================================================");
        console.log("NUEVA SOLICITUD");
        console.log("Proveedor solicitado:", providerConfig.name);
        console.log("Modelo:", providerConfig.model);
        console.log("Dispositivo:", device.type);
        console.log("Sistema:", device.operatingSystem);
        console.log("Entrada:", device.inputMethod);
        console.log("Mensaje:", message.slice(0, 200));
        console.log("================================================");

        const messages = buildMessages(
            message,
            history,
            device
        );

        let usedProvider = provider;
        let answer;

        try {
            answer = await askProvider(provider, messages);

        } catch (providerError) {
            const canFallbackToGroq =
                provider === "gemini" &&
                isGeminiModelUnavailable(providerError) &&
                Boolean(process.env.GROQ_API_KEY);

            if (!canFallbackToGroq) {
                throw providerError;
            }

            console.warn(
                "El modelo Gemini no está disponible. " +
                "Intentando responder con Groq como alternativa."
            );

            // El proveedor seleccionado en la interfaz no cambia.
            // Groq solo se usa como alternativa para este mensaje.
            answer = await askGroq(messages);
            usedProvider = "groq";

            console.log(
                "Respuesta alternativa generada por Groq."
            );
        }

        const actualConfig = PROVIDERS[usedProvider];

        conversationMemory.push({
            timestamp: new Date().toISOString(),
            provider: usedProvider,
            model: actualConfig.model,
            device: device.type,
            operatingSystem: device.operatingSystem,
            inputMethod: device.inputMethod,
            user: message,
            assistant: answer
        });

        if (conversationMemory.length > 100) {
            conversationMemory = conversationMemory.slice(-100);
        }

        saveMemory(conversationMemory);

        return res.json({
            success: true,
            response: answer,
            provider: usedProvider,
            model: actualConfig.model,
            device,
            fallback: usedProvider !== provider
        });

    } catch (error) {
        const safeError = getSafeErrorMessage(error);

        console.error(
            "ERROR PROCESANDO CHAT:",
            safeError
        );

        const status = Number(error?.status);

        const httpStatus =
            status >= 400 && status < 600
                ? status
                : 500;

        return res.status(httpStatus).json({
            success: false,
            error: `Error procesando el mensaje: ${safeError}`
        });
    }
}

// ============================================================
// CHAT
// ============================================================

app.post("/chat", processChat);
app.post("/api/chat", processChat);

// ============================================================
// MEMORIA
// ============================================================

app.get("/api/memory", (req, res) => {
    return res.json({
        success: true,
        memory: conversationMemory
    });
});

// ============================================================
// BORRAR MEMORIA
// ============================================================

app.delete("/api/memory", (req, res) => {
    try {
        conversationMemory = [];

        saveMemory(conversationMemory);

        return res.json({
            success: true,
            message: "Memoria eliminada correctamente."
        });

    } catch (error) {
        console.error(
            "Error eliminando memoria:",
            error?.message || error
        );

        return res.status(500).json({
            success: false,
            error: "No se pudo eliminar la memoria."
        });
    }
});

// ============================================================
// DISPOSITIVO
// ============================================================

app.get("/api/device", (req, res) => {
    const device = detectDevice(req);

    return res.json({
        success: true,
        device
    });
});

// ============================================================
// STATUS
// ============================================================

app.get("/status", (req, res) => {
    const device = detectDevice(req);

    return res.json({
        success: true,
        status: "NOVA IA ONLINE",
        creator: "Yander",

        providers: {
            groq: {
                configured: Boolean(process.env.GROQ_API_KEY),
                model: PROVIDERS.groq.model
            },

            gemini: {
                configured: Boolean(process.env.GEMINI_API_KEY),
                model: PROVIDERS.gemini.model
            },

            openrouter: {
                configured: Boolean(process.env.OPENROUTER_API_KEY),
                model: PROVIDERS.openrouter.model
            }
        },

        memory: conversationMemory.length,
        device
    });
});

// ============================================================
// ARCHIVOS WEB
// ============================================================

if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));

    app.get("/*splat", (req, res, next) => {
        if (
            req.path.startsWith("/api/") ||
            req.path === "/chat" ||
            req.path === "/status"
        ) {
            return next();
        }

        const indexPath = path.join(
            publicPath,
            "index.html"
        );

        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }

        return res.status(404).send(
            "Nova IA: index.html no encontrado."
        );
    });

} else {
    console.warn("La carpeta public no existe.");
}

// ============================================================
// MANEJO GLOBAL DE ERRORES
// ============================================================

app.use((err, req, res, next) => {
    console.error(
        "Error interno:",
        err?.message || err
    );

    if (res.headersSent) {
        return next(err);
    }

    return res.status(500).json({
        success: false,
        error: "Error interno del servidor."
    });
});

// ============================================================
// SERVIDOR
// ============================================================

app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("==========================================");
    console.log("             N O V A   I A");
    console.log("==========================================");
    console.log("Estado: NOVA IA ONLINE");
    console.log(`Puerto: ${PORT}`);
    console.log("Proveedores: Groq / Gemini / OpenRouter");

    console.log(
        `Groq: ${Boolean(process.env.GROQ_API_KEY) ? "CONFIGURADO" : "NO CONFIGURADO"}`
    );

    console.log(
        `Gemini: ${Boolean(process.env.GEMINI_API_KEY) ? "CONFIGURADO" : "NO CONFIGURADO"}`
    );

    console.log(
        `OpenRouter: ${Boolean(process.env.OPENROUTER_API_KEY) ? "CONFIGURADO" : "NO CONFIGURADO"}`
    );

    console.log("Creador: Yander");
    console.log("Entorno principal: DELTA / LUA");
    console.log("Detección de dispositivo: ACTIVADA");
    console.log("Separación Delta / Roblox Studio: ACTIVADA");
    console.log("Alternativa automática de Gemini a Groq: ACTIVADA");
    console.log("==========================================");
    console.log("");
});