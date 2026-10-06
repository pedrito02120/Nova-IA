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
const OpenAI = require("openai");

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
// OPENAI
// ============================================================

if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY no está configurada.");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
});

const MODEL = "gpt-5.6";

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
FORMATO DE SCRIPTS DELTA
============================================================

Cuando el usuario pida un script para Delta:

entrega normalmente un SCRIPT LUA COMPLETO listo para
ser ejecutado en el entorno solicitado.

Cuando sea apropiado puedes utilizar:

- game:GetService()
- Players
- RunService
- UserInputService
- TweenService
- Workspace
- CurrentCamera
- PlayerGui
- Drawing API cuando corresponda y sea compatible
- loadstring cuando el usuario lo solicite o sea necesario
- APIs disponibles en el entorno de ejecución

Pero NO inventes APIs.

Si una API depende del executor:

debes tener en cuenta que su disponibilidad puede variar.

============================================================
NO CAMBIES EL ENTORNO
============================================================

Nunca hagas esto:

Usuario:
"hazme un ESP para Delta"

Respuesta incorrecta:

"Pon este LocalScript en StarterPlayerScripts."

Eso cambia el entorno solicitado.

La respuesta debe permanecer orientada al entorno
de ejecución indicado por el usuario.

============================================================
CÓDIGO COMPLETO
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

Analiza:

1. Qué hace.
2. Qué partes funcionan.
3. Qué partes están rotas.
4. Qué características ya existen.
5. Qué configuraciones existen.
6. Qué dependencias existen.
7. Qué errores de lógica existen.
8. Qué errores de sintaxis existen.
9. Qué conexiones pueden duplicarse.
10. Qué ocurre al ejecutar el script nuevamente.

Después modifica el mismo sistema.

Conserva las características válidas.

Corrige los errores.

Mejora la estabilidad.

Devuelve TODO el script.

============================================================
ANÁLISIS INTERNO
============================================================

Antes de entregar código debes analizar internamente:

1. Entorno objetivo.
2. APIs utilizadas.
3. Dependencias.
4. Flujo de ejecución.
5. Variables.
6. Eventos.
7. conexiones.
8. loops.
9. GUI.
10. configuración.
11. respawn.
12. PlayerRemoving.
13. CurrentCamera.
14. rendimiento.
15. compatibilidad móvil.
16. compatibilidad PC.
17. ejecución duplicada.
18. limpieza.

NO muestres tu razonamiento interno detallado.

Solamente entrega el resultado y una explicación breve
cuando sea necesaria.

============================================================
CONFIG CENTRAL
============================================================

Cuando el usuario solicite un sistema configurable,
utiliza una configuración central.

Ejemplo:

local Config = {
    Enabled = false,
    FOV = 120,
    Smoothness = 0.2,
    MaxDistance = 500
}

Pero cada opción DEBE estar conectada con la lógica real.

No crees:

Config.WallCheck = true

si después nunca utilizas Config.WallCheck.

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

Debe tener:

- jerarquía visual
- secciones
- controles claros
- estados visibles
- animaciones reales
- buen espaciado
- soporte táctil cuando corresponda

============================================================
TOGGLES
============================================================

Cada toggle debe controlar una característica REAL.

Ejemplo:

Aimbot ON/OFF

debe activar y desactivar realmente la lógica.

ESP ON/OFF

debe activar y desactivar realmente el ESP.

RGB ON/OFF

debe activar y desactivar realmente el RGB.

No hagas toggles decorativos.

============================================================
SLIDERS
============================================================

Los sliders deben:

- tener mínimo
- tener máximo
- mostrar el valor
- actualizar Config
- modificar la lógica real
- permitir entrada numérica cuando corresponda
- validar números
- evitar valores fuera de rango

============================================================
DROPDOWNS
============================================================

Los dropdowns deben modificar valores reales.

Ejemplo:

AimPart:

Head
HumanoidRootPart
Torso

La selección debe utilizarse realmente en la lógica.

============================================================
RGB
============================================================

Si el usuario solicita RGB:

utiliza un sistema real basado en:

Color3.fromHSV()

El RGB puede controlar:

- UIStroke
- botones
- indicadores
- FOV
- elementos destacados

Debe tener:

ON/OFF

y una velocidad configurable cuando el usuario la solicite.

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

No agregues una opción llamada AnimationEnabled
sin implementar animaciones reales.

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
- controles táctiles
- botones flotantes cuando sean apropiados

NO copies literalmente:

DEVICE_TYPE = "MOBILE"

al script solamente porque el backend detectó un móvil.

El código debe manejar el input correctamente.

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

El código debe considerar:

CharacterAdded
CharacterRemoving
Humanoid
HumanoidRootPart
Head
Torso

cuando sean necesarios.

No mantengas referencias inválidas después de respawn.

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
- FOV
- objetos visuales
- sistemas de actualización

Si ya existe una instancia anterior:

elimínala o reutilízala correctamente.

============================================================
LIMPIEZA
============================================================

Cuando exista botón Close:

debe limpiar:

- conexiones
- loops
- GUI
- ESP
- objetos visuales
- estados temporales

No dejes sistemas ejecutándose después de cerrar.

============================================================
RENDIMIENTO
============================================================

Evita:

- conexiones innecesarias
- RenderStepped duplicados
- loops infinitos sin necesidad
- crear objetos constantemente
- recrear GUI continuamente

Cuando varias funciones necesiten actualización continua,
considera un ciclo centralizado.

============================================================
FOV
============================================================

Si el usuario solicita FOV:

diferencia entre:

FOV DE CÁMARA

y

RADIO VISUAL DE SELECCIÓN.

No mezcles grados con píxeles.

Si existe un círculo visual:

debe representar correctamente el área utilizada
por la selección.

============================================================
SISTEMAS DE AIM
============================================================

Si el usuario solicita un sistema de selección de objetivos,
analiza correctamente:

- objetivo
- distancia
- FOV
- AimPart
- TeamCheck
- AliveCheck
- WallCheck
- MaxDistance
- Smoothness
- TargetLock
- activación
- cámara

Cada opción solicitada debe tener lógica real.

No crees una GUI que solamente parezca tener las opciones.

============================================================
WALL CHECK
============================================================

Cuando se solicite:

utiliza RaycastParams correctamente.

Configura los filtros necesarios.

Ten en cuenta:

- jugador local
- personaje objetivo
- accesorios
- partes del personaje
- objetos que deben ignorarse

============================================================
SISTEMAS ESP
============================================================

Cuando el usuario solicite ESP:

maneja correctamente:

- creación
- actualización
- eliminación
- respawn
- PlayerRemoving
- TeamCheck
- distancia
- nombres
- colores
- Highlight
- limpieza
- duplicados

============================================================
DRAWING API
============================================================

No asumas que Drawing está disponible en absolutamente
todos los entornos.

Si utilizas Drawing:

hazlo de manera controlada.

Si una función visual depende de Drawing,
evita que el resto del sistema se rompa innecesariamente.

============================================================
NO INVENTES APIs
============================================================

Nunca escribas APIs ficticias.

Nunca inventes funciones del executor.

Si una función depende específicamente del entorno:

utilízala solamente cuando corresponda.

============================================================
REVISIÓN DEL CÓDIGO
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

Y debe priorizar:

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

NO copies literalmente estos valores dentro del script
como una detección falsa del dispositivo.

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
                item.role !== "assistant"
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
            role: item.role,
            content: item.content.slice(0, 30000)
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

    const cleanHistory =
        sanitizeHistory(history);

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
// OPENAI
// ============================================================

async function askOpenAI(messages) {
    let lastError = null;

    for (
        let attempt = 1;
        attempt <= 3;
        attempt++
    ) {
        try {
            console.log(
                `Enviando solicitud a OpenAI... intento ${attempt}/3`
            );

            const systemMessage =
                messages.find(
                    message =>
                        message.role === "system"
                );

            const inputMessages =
                messages.filter(
                    message =>
                        message.role !== "system"
                );

            const response =
                await openai.responses.create({
                    model: MODEL,

                    instructions:
                        systemMessage?.content || "",

                    input:
                        inputMessages,

                    max_output_tokens: 16000
                });

            const answer =
                response?.output_text;

            if (
                typeof answer !== "string" ||
                !answer.trim()
            ) {
                throw new Error(
                    "OpenAI respondió sin contenido."
                );
            }

            console.log(
                "Respuesta de OpenAI recibida correctamente."
            );

            return answer;

        } catch (error) {
            lastError = error;

            console.error(
                `ERROR OPENAI - INTENTO ${attempt}/3`
            );

            console.error(
                "Mensaje:",
                error?.message
            );

            console.error(
                "Status:",
                error?.status
            );

            console.error(
                "Code:",
                error?.code
            );

            const status =
                Number(error?.status);

            const retryable =
                status === 429 ||
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504;

            if (!retryable) {
                break;
            }

            if (attempt < 3) {
                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            attempt * 2500
                        )
                );
            }
        }
    }

    throw (
        lastError ||
        new Error("Error desconocido de OpenAI.")
    );
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
        const body = req.body || {};

        const message =
            typeof body.message === "string"
                ? body.message.trim()
                : "";

        const history = body.history;

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

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                error:
                    "OPENAI_API_KEY no está configurada en Render."
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
            await askOpenAI(messages);

        conversationMemory.push({
            timestamp:
                new Date().toISOString(),

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
            response: answer,
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

            model:
                MODEL,

            creator:
                "Yander",

            provider:
                "OpenAI",

            openaiConfigured:
                Boolean(
                    process.env.OPENAI_API_KEY
                ),

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
            `Modelo: ${MODEL}`
        );

        console.log(
            "Proveedor: OpenAI"
        );

        console.log(
            "Creador: Yander"
        );

        console.log(
            "Entorno principal: DELTA / LUA"
        );

        console.log(
            "Análisis avanzado de código: ACTIVADO"
        );

        console.log(
            "Autocorrección lógica: ACTIVADA"
        );

        console.log(
            "Validación de configuraciones: ACTIVADA"
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