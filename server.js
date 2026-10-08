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
        model: "gemini-2.5-flash",
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

        const raw = fs.readFileSync(
            memoryPath,
            "utf8"
        );

        if (!raw.trim()) {
            return [];
        }

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed;

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

    let inputMethod = "MOUSE_KEYBOARD";

    if (
        type === "MOBILE" ||
        type === "TABLET"
    ) {
        inputMethod = "TOUCH";
    }

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

Tu especialidad principal en esta conversación es:

LUA PARA ROBLOX EJECUTADO MEDIANTE DELTA EXECUTOR.

Cuando el usuario diga:

- Delta
- executor
- ejecutor
- script Lua
- script para ejecutar
- loadstring
- hub
- GUI para executor
- script para Delta

debes interpretar que está solicitando código destinado
a un entorno de ejecución Lua tipo Delta.

============================================================
REGLA CRÍTICA: DELTA NO ES ROBLOX STUDIO
============================================================

NO confundas estos dos entornos.

DELTA EXECUTOR:

El código se ejecuta como script Lua dentro del cliente
de Roblox mediante un entorno de ejecución.

ROBLOX STUDIO:

Es el entorno de desarrollo donde normalmente existen
objetos como:

- StarterGui
- StarterPlayer
- StarterPlayerScripts
- StarterCharacterScripts
- ServerScriptService
- ServerStorage
- ReplicatedStorage
- Workspace configurado desde Studio

NO conviertas automáticamente un script solicitado para
Delta en un script para Roblox Studio.

Si el usuario pide:

"hazme un script para Delta"

NO respondas creando automáticamente:

StarterGui
StarterPlayerScripts
ServerScriptService
ModuleScript de Studio
Script de servidor
LocalScript para colocar manualmente en Studio

salvo que el usuario específicamente lo solicite.

============================================================
REGLA DE PRIORIDAD
============================================================

Si el usuario menciona Delta explícitamente:

EL ENTORNO OBJETIVO ES DELTA.

No cambies el entorno por tu cuenta.

No transformes:

"script para Delta"

en:

"script para Roblox Studio".

No agregues instrucciones como:

"coloca esto en StarterPlayerScripts"

si el usuario no pidió una versión para Studio.

============================================================
REGLA DE CÓDIGO
============================================================

Cuando el usuario solicite un script:

devuelve el script completo.

NO devuelvas:

- fragmentos incompletos
- pseudocódigo
- "..."
- funciones omitidas
- "aquí va el resto"
- sistemas ficticios
- botones sin lógica
- funciones que solamente imprimen mensajes

Si el usuario pide una modificación:

devuelve el código completo modificado.

============================================================
SI EL USUARIO ENTREGA UN SCRIPT
============================================================

Si el usuario proporciona un script existente:

NO lo reemplaces completamente sin motivo.

Analiza qué hace, qué funciona, qué está roto,
qué características existen y qué dependencias tiene.

Conserva las características válidas.

Corrige errores.

Mejora estabilidad y rendimiento.

Devuelve TODO el script.

============================================================
CONFIG CENTRAL
============================================================

Cuando el usuario solicite un sistema configurable,
utiliza una configuración central.

Cada opción debe estar conectada con la lógica real.

No crees configuraciones decorativas.

============================================================
GUI PROFESIONAL
============================================================

Si el usuario solicita una GUI:

la GUI debe ser realmente funcional.

Puede utilizar:

- ScreenGui
- Frame
- TextLabel
- TextButton
- ImageLabel
- ImageButton
- ScrollingFrame
- UICorner
- UIStroke
- UIGradient
- UIPadding
- UIListLayout
- UIGridLayout
- TweenService

Debe tener buena jerarquía visual,
espaciado, controles claros y soporte táctil
cuando corresponda.

============================================================
TOGGLES
============================================================

Cada toggle debe controlar una característica REAL.

No hagas toggles decorativos.

============================================================
SLIDERS
============================================================

Los sliders deben:

- tener mínimo
- tener máximo
- mostrar el valor
- actualizar la configuración
- modificar la lógica real
- validar números
- evitar valores fuera de rango

============================================================
DROPDOWNS
============================================================

Los dropdowns deben modificar valores reales.

============================================================
RGB
============================================================

Si el usuario solicita RGB:

utiliza un sistema real basado en:

Color3.fromHSV()

Debe tener ON/OFF cuando sea solicitado.

============================================================
ANIMACIONES
============================================================

Si se solicitan animaciones:

utiliza TweenService.

Implementa realmente:

- apertura
- cierre
- minimizar
- restaurar
- botones
- toggles
- sliders
- dropdowns

============================================================
MÓVIL
============================================================

Cuando el usuario esté utilizando móvil:

considera:

- Touch
- botones grandes
- controles cómodos
- scrolling
- ausencia de teclado físico

No copies literalmente el tipo de dispositivo detectado
por el backend dentro del script.

Si el script necesita detectar input dentro de Roblox,
debe hacerlo mediante APIs reales.

============================================================
PC
============================================================

En PC puedes utilizar:

- Mouse
- Keyboard
- Keybinds
- Hotkeys

si el usuario los solicita.

============================================================
CURRENT CAMERA
============================================================

Si el código utiliza la cámara:

no dependas de una referencia obsoleta.

Obtén y valida CurrentCamera cuando sea necesario.

============================================================
RESPAWN
============================================================

Considera:

CharacterAdded
CharacterRemoving
Humanoid
HumanoidRootPart
Head
Torso

cuando sean necesarios.

============================================================
PLAYER REMOVING
============================================================

Si el sistema mantiene referencias a otros jugadores:

maneja correctamente cuando abandonen.

============================================================
EJECUCIÓN DUPLICADA
============================================================

El script debe evitar duplicar:

- GUI
- conexiones
- loops
- ESP
- objetos visuales

============================================================
LIMPIEZA
============================================================

Cuando exista botón Close:

debe limpiar correctamente los sistemas creados.

============================================================
RENDIMIENTO
============================================================

Evita:

- conexiones innecesarias
- RenderStepped duplicados
- loops infinitos
- crear objetos constantemente
- recrear GUI continuamente

============================================================
NO INVENTES APIs
============================================================

Nunca escribas APIs ficticias.

Si una función depende específicamente del entorno:

utilízala solamente cuando corresponda.

============================================================
REVISIÓN
============================================================

Antes de entregar el script revisa internamente:

[ ] Sintaxis Lua válida.
[ ] Variables existentes.
[ ] Funciones existentes.
[ ] Servicios correctos.
[ ] Eventos correctos.
[ ] Configuración utilizada.
[ ] Toggles conectados.
[ ] Sliders conectados.
[ ] Dropdowns conectados.
[ ] RGB conectado.
[ ] Animaciones conectadas.
[ ] GUI sin duplicados.
[ ] Conexiones controladas.
[ ] Respawn manejado.
[ ] PlayerRemoving manejado.
[ ] CurrentCamera validada.
[ ] Limpieza implementada.
[ ] Sin pseudocódigo.
[ ] Sin funciones falsas.
[ ] Sin opciones decorativas.
[ ] Código completo.

============================================================
REGLA FINAL
============================================================

Si el usuario dice:

"para Delta"

el entorno objetivo es:

DELTA EXECUTOR.

NO Roblox Studio.

NO StarterGui.

NO StarterPlayerScripts.

NO ServerScriptService.

NO conviertas automáticamente el código a una arquitectura
de Roblox Studio.

Genera el código de acuerdo con el entorno solicitado.

============================================================
OBJETIVO
============================================================

NOVA IA debe:

ENTENDER
→ ANALIZAR
→ DISEÑAR
→ IMPLEMENTAR
→ REVISAR
→ CORREGIR
→ ENTREGAR

Debe priorizar:

- código completo
- lógica real
- estabilidad
- configuración
- compatibilidad
- GUI profesional
- optimización
- mantenimiento

No simplemente producir código largo.
`;

// ============================================================
// CONTEXTO DEL DISPOSITIVO
// ============================================================

function createDeviceContext(device) {
    return `
============================================================
CONTEXTO DEL CLIENTE
============================================================

DISPOSITIVO:
${device.type}

SISTEMA:
${device.operatingSystem}

ENTRADA:
${device.inputMethod}

IMPORTANTE:

Este contexto solamente sirve para adaptar la experiencia
de la GUI y los controles.

NO copies literalmente estos valores dentro del script.

Si el script necesita detectar input dentro de Roblox,
debe hacerlo mediante APIs reales del entorno.

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

            if (
                typeof item.content !== "string"
            ) {
                return false;
            }

            return item.content.trim().length > 0;
        })
        .slice(-20)
        .map(item => ({
            role:
                item.role === "ai"
                    ? "assistant"
                    : item.role,

            content:
                item.content.slice(0, 30000)
        }));
}

// ============================================================
// CONSTRUIR MENSAJES
// ============================================================

function buildMessages(
    userMessage,
    history,
    device
) {
    const messages = [
        {
            role: "system",
            content:
                SYSTEM_PROMPT +
                "\n\n" +
                createDeviceContext(device)
        }
    ];

    let cleanHistory =
        sanitizeHistory(history);

    // Evita duplicar el mensaje actual si el frontend
    // ya lo incluyó dentro del historial.
    const lastMessage =
        cleanHistory[cleanHistory.length - 1];

    if (
        lastMessage &&
        lastMessage.role === "user" &&
        lastMessage.content.trim() === userMessage.trim()
    ) {
        cleanHistory =
            cleanHistory.slice(0, -1);
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

async function fetchJson(
    url,
    options,
    providerName
) {
    const response =
        await fetch(url, options);

    const text =
        await response.text();

    let data = null;

    try {
        data = text
            ? JSON.parse(text)
            : {};
    } catch {
        data = {};
    }

    if (!response.ok) {
        const error =
            new Error(
                data?.error?.message ||
                data?.error ||
                data?.message ||
                text ||
                `Error HTTP ${response.status}`
            );

        error.status =
            response.status;

        error.provider =
            providerName;

        error.raw =
            data;

        throw error;
    }

    return data;
}

// ============================================================
// GROQ
// ============================================================

async function askGroq(messages) {
    const apiKey =
        process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GROQ_API_KEY no está configurada en Render."
        );
    }

    const data =
        await fetchJson(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${apiKey}`
                },

                body: JSON.stringify({
                    model:
                        PROVIDERS.groq.model,

                    messages,

                    max_tokens:
                        16000,

                    temperature:
                        0.7
                })
            },
            "Groq"
        );

    const answer =
        data?.choices?.[0]?.message?.content;

    if (
        typeof answer !== "string" ||
        !answer.trim()
    ) {
        throw new Error(
            "Groq respondió sin contenido."
        );
    }

    return answer;
}

// ============================================================
// GEMINI
// ============================================================

async function askGemini(messages) {
    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY no está configurada en Render."
        );
    }

    const systemMessage =
        messages.find(
            item => item.role === "system"
        );

    const history =
        messages.filter(
            item => item.role !== "system"
        );

    const contents =
        history.map(item => ({
            role:
                item.role === "assistant"
                    ? "model"
                    : "user",

            parts: [
                {
                    text:
                        item.content
                }
            ]
        }));

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${PROVIDERS.gemini.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const data =
        await fetchJson(
            url,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text:
                                    systemMessage?.content ||
                                    ""
                            }
                        ]
                    },

                    contents,

                    generationConfig: {
                        maxOutputTokens:
                            16000,

                        temperature:
                            0.7
                    }
                })
            },
            "Gemini"
        );

    const answer =
        data?.candidates?.[0]?.content?.parts
            ?.map(part => part?.text || "")
            .join("");

    if (
        typeof answer !== "string" ||
        !answer.trim()
    ) {
        throw new Error(
            "Gemini respondió sin contenido."
        );
    }

    return answer;
}

// ============================================================
// OPENROUTER
// ============================================================

async function askOpenRouter(messages) {
    const apiKey =
        process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error(
            "OPENROUTER_API_KEY no está configurada en Render."
        );
    }

    const data =
        await fetchJson(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${apiKey}`,

                    "HTTP-Referer":
                        "https://nova-ia-2oup.onrender.com",

                    "X-Title":
                        "NOVA IA"
                },

                body: JSON.stringify({
                    model:
                        PROVIDERS.openrouter.model,

                    messages,

                    max_tokens:
                        16000,

                    temperature:
                        0.7
                })
            },
            "OpenRouter"
        );

    const answer =
        data?.choices?.[0]?.message?.content;

    if (
        typeof answer !== "string" ||
        !answer.trim()
    ) {
        throw new Error(
            "OpenRouter respondió sin contenido."
        );
    }

    return answer;
}

// ============================================================
// SELECCIONAR PROVEEDOR
// ============================================================

async function askProvider(
    provider,
    messages
) {
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
// ERROR SEGURO
// ============================================================

function getSafeErrorMessage(error) {
    if (!error) {
        return "Error desconocido.";
    }

    const status =
        error?.status
            ? `HTTP ${error.status}`
            : "";

    const code =
        error?.code
            ? `Código: ${error.code}`
            : "";

    let message =
        error?.message ||
        "Error desconocido.";

    if (message.length > 1000) {
        message =
            message.slice(0, 1000) +
            "...";
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
        const body =
            req.body || {};

        const message =
            typeof body.message === "string"
                ? body.message.trim()
                : "";

        const history =
            body.history;

        let provider =
            typeof body.provider === "string"
                ? body.provider.toLowerCase().trim()
                : "groq";

        // Si el frontend manda un proveedor inexistente,
        // usamos Groq como respaldo.
        if (!PROVIDERS[provider]) {
            provider = "groq";
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                error:
                    "El mensaje está vacío."
            });
        }

        if (message.length > 30000) {
            return res.status(400).json({
                success: false,
                error:
                    "El mensaje es demasiado largo."
            });
        }

        const providerConfig =
            PROVIDERS[provider];

        if (
            !process.env[
                providerConfig.env
            ]
        ) {
            return res.status(500).json({
                success: false,
                error:
                    `${providerConfig.env} no está configurada en Render.`
            });
        }

        const device =
            detectDevice(req);

        console.log(
            "================================================"
        );

        console.log(
            "NUEVA SOLICITUD"
        );

        console.log(
            "Proveedor:",
            providerConfig.name
        );

        console.log(
            "Modelo:",
            providerConfig.model
        );

        console.log(
            "Dispositivo:",
            device.type
        );

        console.log(
            "Sistema:",
            device.operatingSystem
        );

        console.log(
            "Entrada:",
            device.inputMethod
        );

        console.log(
            "Mensaje:",
            message.slice(0, 200)
        );

        console.log(
            "================================================"
        );

        const messages =
            buildMessages(
                message,
                history,
                device
            );

        const answer =
            await askProvider(
                provider,
                messages
            );

        conversationMemory.push({
            timestamp:
                new Date().toISOString(),

            provider,

            model:
                providerConfig.model,

            device:
                device.type,

            operatingSystem:
                device.operatingSystem,

            inputMethod:
                device.inputMethod,

            user:
                message,

            assistant:
                answer
        });

        if (
            conversationMemory.length > 100
        ) {
            conversationMemory =
                conversationMemory.slice(-100);
        }

        saveMemory(
            conversationMemory
        );

        return res.json({
            success: true,

            response:
                answer,

            provider,

            model:
                providerConfig.model,

            device
        });

    } catch (error) {
        const safeError =
            getSafeErrorMessage(error);

        console.error(
            "ERROR PROCESANDO CHAT:",
            safeError
        );

        const status =
            Number(error?.status);

        const httpStatus =
            status >= 400 &&
            status < 600
                ? status
                : 500;

        return res.status(
            httpStatus
        ).json({
            success: false,

            error:
                `Error procesando el mensaje: ${safeError}`
        });
    }
}

// ============================================================
// CHAT
// ============================================================

app.post(
    "/chat",
    processChat
);

app.post(
    "/api/chat",
    processChat
);

// ============================================================
// MEMORIA
// ============================================================

app.get(
    "/api/memory",
    (req, res) => {
        return res.json({
            success: true,

            memory:
                conversationMemory
        });
    }
);

// ============================================================
// BORRAR MEMORIA
// ============================================================

app.delete(
    "/api/memory",
    (req, res) => {
        try {
            conversationMemory = [];

            saveMemory(
                conversationMemory
            );

            return res.json({
                success: true,

                message:
                    "Memoria eliminada correctamente."
            });

        } catch (error) {
            console.error(
                "Error eliminando memoria:",
                error?.message || error
            );

            return res.status(500).json({
                success: false,

                error:
                    "No se pudo eliminar la memoria."
            });
        }
    }
);

// ============================================================
// DISPOSITIVO
// ============================================================

app.get(
    "/api/device",
    (req, res) => {
        const device =
            detectDevice(req);

        return res.json({
            success: true,

            device
        });
    }
);

// ============================================================
// STATUS
// ============================================================

app.get(
    "/status",
    (req, res) => {
        const device =
            detectDevice(req);

        return res.json({
            success: true,

            status:
                "NOVA IA ONLINE",

            creator:
                "Yander",

            providers: {
                groq: {
                    configured:
                        Boolean(
                            process.env.GROQ_API_KEY
                        ),

                    model:
                        PROVIDERS.groq.model
                },

                gemini: {
                    configured:
                        Boolean(
                            process.env.GEMINI_API_KEY
                        ),

                    model:
                        PROVIDERS.gemini.model
                },

                openrouter: {
                    configured:
                        Boolean(
                            process.env.OPENROUTER_API_KEY
                        ),

                    model:
                        PROVIDERS.openrouter.model
                }
            },

            memory:
                conversationMemory.length,

            device
        });
    }
);

// ============================================================
// ARCHIVOS WEB
// ============================================================

if (
    fs.existsSync(publicPath)
) {
    app.use(
        express.static(
            publicPath
        )
    );

    app.get(
        "/*splat",
        (req, res, next) => {

            if (
                req.path.startsWith("/api/") ||
                req.path === "/chat" ||
                req.path === "/status"
            ) {
                return next();
            }

            const indexPath =
                path.join(
                    publicPath,
                    "index.html"
                );

            if (
                fs.existsSync(indexPath)
            ) {
                return res.sendFile(
                    indexPath
                );
            }

            return res.status(404).send(
                "Nova IA: index.html no encontrado."
            );
        }
    );

} else {
    console.warn(
        "⚠️ La carpeta public no existe."
    );
}

// ============================================================
// MANEJO GLOBAL DE ERRORES
// ============================================================

app.use(
    (err, req, res, next) => {
        console.error(
            "Error interno:",
            err?.message || err
        );

        if (
            res.headersSent
        ) {
            return next(err);
        }

        return res.status(500).json({
            success: false,

            error:
                "Error interno del servidor."
        });
    }
);

// ============================================================
// SERVIDOR
// ============================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");

        console.log(
            "=========================================="
        );

        console.log(
            "             N O V A   I A"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "Estado: NOVA IA ONLINE"
        );

        console.log(
            `Puerto: ${PORT}`
        );

        console.log(
            "Proveedores: Groq / Gemini / OpenRouter"
        );

        console.log(
            `Groq: ${Boolean(process.env.GROQ_API_KEY) ? "CONFIGURADO" : "NO CONFIGURADO"}`
        );

        console.log(
            `Gemini: ${Boolean(process.env.GEMINI_API_KEY) ? "CONFIGURADO" : "NO CONFIGURADO"}`
        );

        console.log(
            `OpenRouter: ${Boolean(process.env.OPENROUTER_API_KEY) ? "CONFIGURADO" : "NO CONFIGURADO"}`
        );

        console.log(
            "Creador: Yander"
        );

        console.log(
            "Entorno principal: DELTA / LUA"
        );

        console.log(
            "Detección de dispositivo: ACTIVADA"
        );

        console.log(
            "Separación Delta / Roblox Studio: ACTIVADA"
        );

        console.log(
            "=========================================="
        );

        console.log("");
    }
);

Ahora haz solo esto

En Render → Environment Variables, asegúrate de tener:

GROQ_API_KEY
GEMINI_API_KEY
OPENROUTER_API_KEY

No tienes que instalar nada nuevo.

El backend ya acepta:

provider: "groq"
provider: "gemini"
provider: "openrouter"

Groq usa actualmente "openai/gpt-oss-120b", mientras que OpenRouter tiene un router gratuito "openrouter/free"; ambos están documentados como compatibles con sus APIs respectivas.

Después de subir este "server.js" a Render, el siguiente paso es modificar tu "ia.html" para que el botón de las estrellitas abra el selector con Groq / Gemini / OpenRouter, y que al tocar uno realmente mande "provider" al backend.