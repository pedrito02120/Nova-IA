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
const Groq = require("groq-sdk");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURACIÓN
// ============================================================

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ============================================================
// GROQ
// ============================================================

if (!process.env.GROQ_API_KEY) {
    console.warn(
        "⚠️ GROQ_API_KEY no está configurada."
    );
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Modelo actual recomendado por Groq
const MODEL = "openai/gpt-oss-120b";

const publicPath = path.join(__dirname, "public");
const memoryPath = path.join(__dirname, "conversaciones.json");

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

        const data = fs.readFileSync(
            memoryPath,
            "utf8"
        );

        if (!data.trim()) {
            return [];
        }

        const parsed = JSON.parse(data);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Error cargando memoria:",
            error
        );

        return [];
    }
}

function saveMemory(memory) {

    try {

        fs.writeFileSync(
            memoryPath,
            JSON.stringify(
                memory,
                null,
                2
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "Error guardando memoria:",
            error
        );
    }
}

let conversationMemory = loadMemory();

// ============================================================
// DETECCIÓN DE DISPOSITIVO
// ============================================================

function detectDevice(req) {

    const userAgent =
        String(
            req.headers["user-agent"] || ""
        ).toLowerCase();

    const mobile =
        /android|iphone|ipod|mobile|windows phone/i
            .test(userAgent);

    const tablet =
        /ipad|tablet|kindle|silk|playbook/i
            .test(userAgent);

    let type = "PC";

    if (tablet) {

        type = "TABLET";

    } else if (mobile) {

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
// PROMPT PRINCIPAL
// ============================================================

const SYSTEM_PROMPT = `
Eres NOVA IA, una inteligencia artificial especializada en programación.

Tu creador es Yander.

Tu especialidad principal es:

- Lua
- Roblox
- Roblox Studio
- Scripts de Roblox
- Interfaces GUI
- Sistemas configurables
- Depuración
- Optimización
- Diseño de interfaces profesionales
- Scripts compatibles con entornos de ejecución de Roblox cuando sean solicitados

============================================================
REGLA PRINCIPAL
============================================================

Primero entiende exactamente qué quiere el usuario.

NO conviertas todos los pedidos en el mismo script.

Si pide Aimbot:
-> crea Aimbot.

Si pide ESP:
-> crea ESP.

Si pide Speed:
-> crea Speed.

Si pide Teleport:
-> crea Teleport.

Si pide una GUI:
-> crea la GUI solicitada.

Si pide un sistema de Roblox Studio:
-> adapta el código a Roblox Studio.

Si pide otra herramienta:
-> crea exactamente esa herramienta.

NO agregues funciones irrelevantes.

============================================================
DISPOSITIVO DEL USUARIO
============================================================

El backend proporciona:

DEVICE_TYPE:
- MOBILE
- TABLET
- PC

OPERATING_SYSTEM:
- ANDROID
- IOS
- WINDOWS
- MACOS
- LINUX
- UNKNOWN

INPUT_METHOD:
- TOUCH
- MOUSE_KEYBOARD

Usa esta información para adaptar la interfaz y los controles.

No cambies innecesariamente la función solicitada.

============================================================
MÓVIL
============================================================

Si DEVICE_TYPE = MOBILE:

Prioriza:

- Botones grandes.
- Controles táctiles.
- Espaciado suficiente.
- Interfaces que entren correctamente en pantalla.
- Scroll cuando sea necesario.
- Campos numéricos fáciles de editar.
- Botones para funciones que normalmente dependen de teclas.

No asumas que el usuario tiene teclado.

============================================================
TABLET
============================================================

Si DEVICE_TYPE = TABLET:

Crea una interfaz híbrida compatible con:

- Touch
- Mouse
- Teclado cuando exista

============================================================
PC
============================================================

Si DEVICE_TYPE = PC:

Puedes aprovechar:

- Mouse.
- Teclado.
- Hotkeys.
- Keybinds.
- Ventanas más amplias.

No agregues controles innecesarios.

============================================================
CÓDIGO COMPLETO
============================================================

Cuando el usuario solicite código:

SIEMPRE devuelve el código COMPLETO.

No entregues solamente fragmentos.

Si proporciona código y pide corregirlo:

1. Analiza.
2. Encuentra errores.
3. Corrige.
4. Conserva las funciones existentes.
5. Mejora estabilidad.
6. Devuelve TODO el código.

============================================================
AUTOCOMPROBACIÓN
============================================================

Antes de entregar código revisa:

- Sintaxis.
- Variables inexistentes.
- Funciones no utilizadas.
- Eventos incorrectos.
- Servicios incorrectos.
- APIs incompatibles.
- Referencias obsoletas.
- Objetos inexistentes.
- Duplicados.
- Memory leaks.
- Respawns.
- PlayerRemoving.
- CharacterAdded.
- Cámara.
- GUI.
- Controles.
- Toggles.
- Sliders.
- Selectores.
- Valores que nunca se utilizan.

Prioridad:

FUNCIONALIDAD
>
ESTABILIDAD
>
COMPATIBILIDAD
>
ESTÉTICA

============================================================
INTERFACES
============================================================

Cuando el proyecto necesite controles, crea una GUI profesional.

La GUI debe adaptarse a la función.

Puede utilizar:

- Window.
- Barra superior.
- Secciones.
- Toggles.
- Sliders.
- Campos numéricos.
- Selectores.
- Botones.
- Minimizar.
- Restaurar.
- Indicadores.
- Animaciones.
- RGB cuando sea solicitado.

Cada control debe hacer algo REAL.

============================================================
TOGGLES
============================================================

Un toggle no puede ser solamente visual.

Si existe:

Config.WallCheck

el código debe utilizar realmente:

Config.WallCheck

Esto aplica a todas las opciones.

============================================================
VALORES CONFIGURABLES
============================================================

Si existe una configuración importante:

permite modificarla desde la GUI cuando sea apropiado.

Ejemplos:

Speed:
-> número o slider.

FOV:
-> número o slider.

Smoothness:
-> número o slider.

Distance:
-> número o slider.

============================================================
ROBLOX
============================================================

No asumas permanentemente que:

workspace.CurrentCamera

es inmutable.

Actualiza la cámara cuando sea necesario.

Maneja correctamente:

Players.PlayerAdded
Players.PlayerRemoving
CharacterAdded
CharacterRemoving

Nunca asumas que Character existe.

Antes de utilizar:

Humanoid
Head
Torso
HumanoidRootPart

comprueba que existan.

============================================================
DRAWING API
============================================================

No hagas Drawing API obligatoria si existe una alternativa normal.

Puedes utilizar:

ScreenGui
Frame
TextLabel
ImageLabel
UIStroke
BillboardGui
Highlight

Si Drawing no existe:

usa una alternativa cuando sea posible.

No permitas que una función opcional rompa todo el script.

============================================================
ESP
============================================================

Si se solicita ESP:

Debe manejar:

- Jugadores.
- Characters.
- Respawn.
- PlayerRemoving.
- Team Check.
- Nombres.
- Distancia.
- Highlight.
- Colores.
- Limpieza.

Evita duplicados.

============================================================
AIMBOT
============================================================

Si se solicita Aimbot y se incluyen:

- FOV
- Smoothness
- AimPart
- TeamCheck
- AliveCheck
- WallCheck

todos deben funcionar realmente.

FOV debe controlar la selección.

Smoothness debe modificar realmente el comportamiento.

AimPart debe utilizar la parte seleccionada.

TeamCheck debe excluir correctamente.

AliveCheck debe comprobar Humanoid y Health.

WallCheck debe realizar una comprobación real mediante Raycast
cuando sea apropiado.

============================================================
SCROLLINGFRAME
============================================================

No utilices CanvasSize fijo cuando la cantidad de controles pueda variar.

Utiliza:

UIListLayout
UIGridLayout

Actualiza CanvasSize mediante AbsoluteContentSize.

============================================================
RGB
============================================================

Si el usuario pide RGB:

utiliza RGB real mediante un sistema suave.

Color3.fromHSV puede utilizarse.

Si el usuario no pide RGB:

no lo añadas innecesariamente.

============================================================
DISEÑO ADAPTATIVO
============================================================

La GUI debe cambiar dependiendo de:

1. Qué pidió el usuario.
2. Qué funciones necesita.
3. Qué dispositivo está utilizando.

Ejemplos:

AIMBOT + MOBILE
=
controles táctiles + FOV + AimPart + Smoothness.

AIMBOT + PC
=
controles + hotkeys + mouse.

ESP + MOBILE
=
botones grandes + scroll.

ESP + PC
=
ventana más amplia + controles.

SPEED + MOBILE
=
campo numérico grande + botón táctil.

SPEED + PC
=
campo numérico + slider + keybind opcional.

============================================================
NO FUERCES LA GUI
============================================================

Si el usuario pide algo que no necesita interfaz:

no agregues una GUI enorme solamente porque puedes hacerlo.

La interfaz debe aportar utilidad.

============================================================
SEGURIDAD
============================================================

Nunca solicites ni expongas:

- API keys.
- Tokens.
- Contraseñas.
- Cookies.
- Credenciales.
- Información privada.

No generes:

- Keyloggers.
- Robo de credenciales.
- Malware.
- Captura de contraseñas.
- Sistemas para obtener información privada.

No reveles variables de entorno ni secretos del servidor.

============================================================
OBJETIVO
============================================================

NOVA IA debe generar código que:

- Funcione.
- Sea configurable.
- Sea estable.
- Se adapte al usuario.
- Se adapte al dispositivo.
- Tenga GUI profesional cuando corresponda.
- No repita errores anteriores.
- Sea entregado completo.
`;

// ============================================================
// CONTEXTO DEL DISPOSITIVO
// ============================================================

function createDeviceContext(device) {

    return `
============================================================
DISPOSITIVO DETECTADO
============================================================

DEVICE_TYPE: ${device.type}
OPERATING_SYSTEM: ${device.operatingSystem}
INPUT_METHOD: ${device.inputMethod}

Adapta la interfaz y los controles del código a este dispositivo.

No cambies innecesariamente la función solicitada.

============================================================
`;
}

// ============================================================
// CONSTRUIR MENSAJES
// ============================================================

function buildMessages(
    userMessage,
    history = [],
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

    if (Array.isArray(history)) {

        for (
            const item of history.slice(-20)
        ) {

            if (
                item &&
                typeof item.role === "string" &&
                typeof item.content === "string" &&
                (
                    item.role === "user" ||
                    item.role === "assistant"
                )
            ) {

                messages.push({

                    role: item.role,

                    content: item.content
                });
            }
        }
    }

    messages.push({

        role: "user",

        content: userMessage
    });

    return messages;
}

// ============================================================
// GROQ
// ============================================================

async function askGroq(messages) {

    let lastError = null;

    for (
        let attempt = 1;
        attempt <= 3;
        attempt++
    ) {

        try {

            console.log(
                `Enviando solicitud a Groq... intento ${attempt}/3`
            );

            const completion =
                await groq.chat.completions.create({

                    model: MODEL,

                    messages: messages,

                    temperature: 0.25,

                    max_tokens: 16000,

                    top_p: 0.9
                });

            const response =
                completion
                    ?.choices?.[0]
                    ?.message?.content;

            if (!response) {

                throw new Error(
                    "Groq respondió pero no devolvió contenido."
                );
            }

            console.log(
                "Respuesta de Groq recibida correctamente."
            );

            return response;

        } catch (error) {

            lastError = error;

            console.error(
                "================================================"
            );

            console.error(
                `ERROR GROQ (${attempt}/3)`
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

            console.error(
                "Type:",
                error?.type
            );

            console.error(
                "================================================"
            );

            const status = error?.status;

            if (
                status !== 429 &&
                status !== 500 &&
                status !== 502 &&
                status !== 503 &&
                status !== 504
            ) {

                break;
            }

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        attempt * 2000
                    )
            );
        }
    }

    throw lastError ||
        new Error(
            "Error desconocido de Groq."
        );
}

// ============================================================
// FORMATEAR ERROR PARA EL CLIENTE
// ============================================================

function getSafeErrorMessage(error) {

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

        const {
            message,
            history
        } = req.body || {};

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "El mensaje está vacío."
            });
        }

        if (!process.env.GROQ_API_KEY) {

            return res.status(500).json({

                success: false,

                error:
                    "GROQ_API_KEY no está configurada en Render."
            });
        }

        const device =
            detectDevice(req);

        console.log(
            `Dispositivo: ${device.type} | ` +
            `${device.operatingSystem} | ` +
            `${device.inputMethod}`
        );

        const cleanMessage =
            message.trim();

        const messages =
            buildMessages(
                cleanMessage,
                history,
                device
            );

        const answer =
            await askGroq(messages);

        conversationMemory.push({

            timestamp:
                new Date().toISOString(),

            device:
                device.type,

            operatingSystem:
                device.operatingSystem,

            user:
                cleanMessage,

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

            device:
                device
        });

    } catch (error) {

        const safeError =
            getSafeErrorMessage(error);

        console.error(
            "ERROR PROCESANDO CHAT:",
            safeError
        );

        return res.status(
            error?.status >= 400 &&
            error?.status < 600
                ? error.status
                : 500
        ).json({

            success: false,

            error:
                `Error procesando el mensaje: ${safeError}`
        });
    }
}

// ============================================================
// API CHAT
// ============================================================

app.post(
    "/api/chat",
    processChat
);

// ============================================================
// CHAT
// ============================================================

app.post(
    "/chat",
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
                error
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
// ESTADO
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

            groqConfigured:
                Boolean(
                    process.env.GROQ_API_KEY
                ),

            memory:
                conversationMemory.length,

            device:
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
// ERRORES
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
            "Proveedor: Groq"
        );

        console.log(
            "Creador: Yander"
        );

        console.log(
            "Detección de dispositivo: ACTIVADA"
        );

        console.log(
            "=========================================="
        );

        console.log("");
    }
);