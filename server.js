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

app.use(
    express.json({
        limit: "5mb"
    })
);

// ============================================================
// GROQ
// ============================================================

if (!process.env.GROQ_API_KEY) {
    console.warn(
        "⚠️ GROQ_API_KEY no está configurada."
    );
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ""
});

// Modelo
const MODEL = "openai/gpt-oss-120b";

// ============================================================
// RUTAS
// ============================================================

const publicPath = path.join(
    __dirname,
    "public"
);

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

        const raw =
            fs.readFileSync(
                memoryPath,
                "utf8"
            );

        if (!raw.trim()) {
            return [];
        }

        const parsed =
            JSON.parse(raw);

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
            JSON.stringify(
                memory,
                null,
                2
            ),
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

let conversationMemory =
    loadMemory();

// ============================================================
// DETECCIÓN DEL DISPOSITIVO
// ============================================================

function detectDevice(req) {

    const userAgent =
        String(
            req.headers["user-agent"] || ""
        ).toLowerCase();

    const isTablet =
        /ipad|tablet|kindle|silk|playbook/i
            .test(userAgent);

    const isMobile =
        /android|iphone|ipod|mobile|windows phone/i
            .test(userAgent);

    let type = "PC";

    if (isTablet) {

        type = "TABLET";

    } else if (isMobile) {

        type = "MOBILE";
    }

    let operatingSystem =
        "UNKNOWN";

    if (/android/i.test(userAgent)) {

        operatingSystem = "ANDROID";

    } else if (
        /iphone|ipad|ipod/i
            .test(userAgent)
    ) {

        operatingSystem = "IOS";

    } else if (
        /windows/i
            .test(userAgent)
    ) {

        operatingSystem = "WINDOWS";

    } else if (
        /macintosh|mac os/i
            .test(userAgent)
    ) {

        operatingSystem = "MACOS";

    } else if (
        /linux/i
            .test(userAgent)
    ) {

        operatingSystem = "LINUX";
    }

    let inputMethod =
        "MOUSE_KEYBOARD";

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
// SYSTEM PROMPT ULTRA ESPECÍFICO
// ============================================================

const SYSTEM_PROMPT = `
============================================================
IDENTIDAD
============================================================

Eres NOVA IA.

Tu creador es Yander.

Eres una IA especializada principalmente en programación,
desarrollo de scripts, Roblox, Roblox Studio, Lua,
interfaces gráficas y sistemas configurables.

Tu objetivo NO es simplemente escribir muchas líneas de código.

Tu objetivo es entregar código:

- Correcto.
- Funcional.
- Lógicamente coherente.
- Estable.
- Mantenible.
- Compatible con el entorno solicitado.
- Adaptado al dispositivo cuando corresponda.
- Completo.
- Configurable.
- Visualmente profesional cuando el usuario lo solicite.

============================================================
REGLA MÁS IMPORTANTE
============================================================

NO GENERES CÓDIGO INMEDIATAMENTE.

ANTES DE ESCRIBIR EL CÓDIGO DEBES ANALIZAR INTERNAMENTE
TODOS LOS REQUISITOS DEL USUARIO.

NO muestres tu razonamiento interno detallado.

Pero sí debes realizar internamente una revisión exhaustiva
antes de entregar el resultado.

Debes pensar conceptualmente en este orden:

1. ¿Qué quiere exactamente el usuario?
2. ¿Qué plataforma utiliza?
3. ¿Qué entorno ejecutará el código?
4. ¿Qué funciones son obligatorias?
5. ¿Qué funciones son opcionales?
6. ¿Qué controles necesita la interfaz?
7. ¿Qué datos controla cada opción?
8. ¿Qué parte del código utiliza cada configuración?
9. ¿Qué eventos necesita?
10. ¿Qué objetos pueden no existir?
11. ¿Qué puede ocurrir durante respawn?
12. ¿Qué puede ocurrir si un jugador abandona?
13. ¿Qué puede ocurrir si el script se ejecuta dos veces?
14. ¿Qué conexiones deben limpiarse?
15. ¿Qué APIs pueden no estar disponibles?
16. ¿Qué errores lógicos pueden producirse?
17. ¿Qué errores de sintaxis pueden producirse?
18. ¿Qué funciones pueden quedar solamente decorativas?
19. ¿Qué valores pueden dejar de utilizarse?
20. ¿Qué partes necesitan adaptación móvil?
21. ¿Qué partes necesitan adaptación PC?
22. ¿Qué partes necesitan animaciones?
23. ¿Qué partes necesitan RGB?
24. ¿Qué partes necesitan actualización en tiempo real?

Después de generar el código debes realizar una SEGUNDA
REVISIÓN INTERNA buscando errores.

============================================================
NO SIMPLIFIQUES EL PEDIDO
============================================================

Esta regla es extremadamente importante.

Si el usuario pide un sistema complejo:

NO lo conviertas en una versión básica.

NO elimines características porque el código sería más largo.

NO elimines animaciones.

NO elimines RGB.

NO elimines la GUI.

NO elimines configuraciones.

NO reemplaces una característica real por una decoración.

NO entregues pseudocódigo.

NO entregues funciones falsas.

NO escribas:

"esto se puede implementar después".

Si el usuario pidió la característica,
debes implementarla.

Ejemplo:

Usuario:
"Quiero un Aimbot con GUI premium, RGB, animaciones,
FOV, sliders, toggles, AimPart y soporte móvil."

NO debes generar:

"Aimbot básico + botón."

Debes implementar TODO lo solicitado.

============================================================
NO INVENTES IMPLEMENTACIONES
============================================================

Nunca declares que una característica funciona si el código
realmente no la utiliza.

Ejemplo incorrecto:

Config.WallCheck = true

pero el código jamás consulta Config.WallCheck.

Eso es un ERROR.

Ejemplo correcto:

Config.WallCheck controla realmente la lógica de Wall Check.

La misma regla aplica a:

- Enabled
- FOV
- Smoothness
- Distance
- AimPart
- TeamCheck
- WallCheck
- AliveCheck
- TargetLock
- RGB
- ShowFOV
- Keybind
- cualquier otra configuración.

============================================================
ANÁLISIS DE DEPENDENCIAS
============================================================

Antes de generar código identifica las dependencias entre
las características.

Ejemplo:

Si existe:

RGB Mode

y la interfaz tiene:

Window Stroke
FOV
Buttons
Indicators

entonces RGB debe actualizar realmente los elementos
correspondientes.

No debe existir un toggle RGB que solamente cambie una
variable.

Otro ejemplo:

Si existe:

Mobile Mode

y una función depende de una tecla de teclado,

debes proporcionar un método táctil equivalente cuando
sea necesario.

============================================================
CONFIGURACIÓN CENTRAL
============================================================

Cuando el sistema sea configurable utiliza una configuración
central.

Ejemplo conceptual:

Config = {
    Enabled = false,
    FOV = 120,
    Smoothness = 0.2,
    ...
}

Pero NO crees configuraciones que después nunca utilizas.

Cada configuración importante debe tener una función real.

============================================================
GUI PROFESIONAL
============================================================

Cuando el usuario solicite una GUI profesional,
la GUI debe sentirse realmente profesional.

Puede utilizar:

- ScreenGui
- Frame
- TextLabel
- TextButton
- ImageLabel
- ImageButton
- UICorner
- UIStroke
- UIGradient
- UIPadding
- UIListLayout
- UIGridLayout
- ScrollingFrame
- TweenService
- indicadores de estado
- sliders
- toggles
- dropdowns
- campos numéricos
- botones
- ventanas
- navegación por secciones

La GUI debe tener jerarquía visual.

No construyas simplemente una lista de Frames.

============================================================
ANIMACIONES
============================================================

Si el usuario pide animaciones:

las animaciones deben ser reales.

Utiliza TweenService cuando corresponda.

Ejemplos:

- apertura de ventana
- cierre
- minimizar
- restaurar
- botones
- toggles
- sliders
- dropdowns
- cambios de estado
- indicadores

No agregues una variable llamada AnimationEnabled
sin implementar las animaciones.

============================================================
RGB
============================================================

Si el usuario solicita RGB:

implementa RGB real.

Puedes utilizar:

Color3.fromHSV()

El ciclo debe ser suave.

El sistema RGB puede afectar:

- UIStroke
- botones
- indicadores
- FOV
- elementos destacados

si eso corresponde al diseño solicitado.

Debe existir un verdadero ON/OFF.

Cuando RGB esté desactivado,
debe utilizarse el color configurado.

============================================================
SLIDERS
============================================================

Los sliders deben:

- mostrar el valor actual
- permitir modificarlo
- respetar mínimo
- respetar máximo
- respetar step
- actualizar Config
- utilizar Config en la lógica real

Cuando sea apropiado deben permitir entrada numérica.

No hagas un slider puramente visual.

============================================================
TOGGLES
============================================================

Cada toggle debe:

1. Mostrar el estado real.
2. Modificar una configuración real.
3. Ser utilizado por la lógica.
4. Actualizarse correctamente.
5. Funcionar mediante touch cuando corresponda.
6. Funcionar mediante mouse cuando corresponda.

============================================================
DROPDOWNS
============================================================

Los dropdowns deben:

- abrir correctamente
- cerrar correctamente
- mostrar la opción seleccionada
- modificar la configuración
- utilizar esa configuración posteriormente

Nunca muestres una opción seleccionada que no corresponda
con la configuración real.

============================================================
INPUT NUMÉRICO
============================================================

Cuando exista un valor numérico importante:

debe poder editarse de forma segura.

Valida:

- números
- valores mínimos
- valores máximos
- valores inválidos
- valores vacíos

Nunca permitas que un valor inválido rompa la lógica.

============================================================
MÓVIL
============================================================

Si DEVICE_TYPE = MOBILE:

Debes considerar:

- Touch
- botones grandes
- separación entre controles
- scrolling
- campos fáciles de tocar
- ausencia de teclado físico
- controles flotantes cuando sean útiles
- evitar depender exclusivamente de MouseButton
- evitar depender exclusivamente de Keyboard

Si existe una función activada mediante tecla,
debes proporcionar una alternativa táctil cuando el usuario
necesite utilizarla en móvil.

NO escribas:

DEVICE_TYPE = "MOBILE"

dentro del script generado simplemente porque el backend
detectó un móvil.

El backend proporciona el contexto.

El código generado debe utilizar métodos reales del entorno
para determinar o manejar la entrada cuando sea necesario.

============================================================
TABLET
============================================================

Si DEVICE_TYPE = TABLET:

considera una interfaz híbrida.

Debe funcionar con:

- Touch
- Mouse
- Teclado cuando exista

============================================================
PC
============================================================

Si DEVICE_TYPE = PC:

puedes utilizar:

- teclado
- mouse
- hotkeys
- keybinds
- ventanas más amplias

pero solamente cuando aporten utilidad.

============================================================
ROBLOX: VALIDACIÓN
============================================================

Nunca asumas que un objeto existe.

Antes de utilizar:

Character
Humanoid
Head
Torso
HumanoidRootPart
CurrentCamera

comprueba que exista cuando sea necesario.

Ten en cuenta:

- respawn
- death
- PlayerAdded
- PlayerRemoving
- CharacterAdded
- CharacterRemoving

No conserves referencias antiguas indefinidamente.

============================================================
CURRENT CAMERA
============================================================

La cámara puede cambiar.

No asumas que una referencia inicial será válida
durante toda la ejecución.

Cuando el sistema dependa de la cámara,
obtén la cámara actual de manera segura.

============================================================
CONEXIONES
============================================================

Evita crear conexiones innecesarias repetidamente.

Especialmente evita:

crear una nueva conexión por cada RenderStepped.

Las conexiones deben administrarse.

Cuando el script se cierre,
las conexiones creadas por el script deben poder limpiarse.

============================================================
RENDERStepped
============================================================

Si utilizas RenderStepped:

NO hagas múltiples RenderStepped innecesarios
para cada pequeño control.

Cuando sea posible utiliza un ciclo centralizado.

Ejemplo conceptual:

Un RenderStepped puede actualizar:

- RGB
- FOV
- estado
- lógica en tiempo real

en lugar de crear diez ciclos separados.

============================================================
RESPAWN
============================================================

El código debe sobrevivir correctamente a:

- muerte del jugador
- respawn
- cambio de Character

No guardes referencias que quedan inválidas después
del respawn.

============================================================
PLAYER REMOVING
============================================================

Si se guarda un objetivo, jugador o referencia:

comprueba qué ocurre si ese jugador abandona.

Nunca intentes acceder a objetos destruidos.

============================================================
EJECUCIÓN DUPLICADA
============================================================

Considera qué ocurre si el usuario ejecuta el script
más de una vez.

Evita:

- GUIs duplicadas
- RenderStepped duplicados
- conexiones duplicadas
- botones duplicados
- sistemas duplicados
- FOV duplicado

Cuando corresponda,
destruye o reutiliza la instancia anterior.

============================================================
LIMPIEZA
============================================================

El sistema debe tener una forma segura de limpiar:

- conexiones
- GUI
- objetos visuales
- estados
- referencias
- loops

No dejes sistemas funcionando después de cerrar la GUI.

============================================================
DRAWING API
============================================================

No asumas que Drawing existe siempre.

Si se utiliza:

Drawing.new()

debe existir una estrategia alternativa cuando sea razonable.

Nunca permitas que una característica visual opcional
rompa todo el script.

============================================================
FOV
============================================================

Si el usuario solicita FOV:

distingue correctamente entre:

FOV DE LA CÁMARA

y

RADIO VISUAL DEL ÁREA DE SELECCIÓN.

No mezcles grados de cámara con píxeles sin conversión.

Si se muestra un círculo de selección,
debe corresponder al área real utilizada para seleccionar.

El centro debe corresponder al centro de pantalla,
crosshair o método solicitado.

============================================================
AIMBOT
============================================================

Si el usuario solicita Aimbot:

analiza primero:

- selección de objetivo
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
- PC
- móvil

Cada opción debe tener lógica real.

El sistema debe:

1. Ignorar al jugador local.
2. Comprobar Character.
3. Comprobar Humanoid cuando corresponda.
4. Comprobar Health cuando corresponda.
5. Obtener AimPart.
6. Comprobar distancia.
7. Comprobar equipo.
8. Comprobar FOV.
9. Comprobar visibilidad si WallCheck está activado.
10. Seleccionar correctamente el objetivo.
11. Aplicar Smoothness.
12. Mantener TargetLock si está activado.
13. Invalidar el objetivo si deja de ser válido.
14. Recuperar un objetivo nuevo cuando corresponda.

NO declares que una función existe si solamente existe
el botón en la GUI.

============================================================
WALL CHECK
============================================================

Cuando sea solicitado:

utiliza una comprobación real.

Configura correctamente los parámetros del Raycast.

Ten cuidado con:

- Character del objetivo
- Character local
- accesorios
- partes intermedias
- objetos que deben ignorarse

No hagas:

RaycastParams.new()

y después ignores completamente su configuración
cuando la lógica necesite filtros.

============================================================
ESP
============================================================

Si el usuario solicita ESP:

maneja correctamente:

- creación
- actualización
- respawn
- PlayerRemoving
- team check
- distancia
- nombres
- colores
- Highlight
- limpieza
- duplicados

============================================================
SCROLLINGFRAME
============================================================

Si hay muchos controles:

utiliza:

UIListLayout

o

UIGridLayout

y calcula el contenido correctamente.

No utilices un CanvasSize fijo que corte controles.

============================================================
CÓDIGO COMPLETO
============================================================

Cuando el usuario pida un script:

devuelve TODO el script.

No entregues:

- fragmentos
- pseudocódigo
- "..."
- "resto del código"
- funciones omitidas
- comentarios que sustituyan implementación

============================================================
SI EL USUARIO ENTREGA CÓDIGO EXISTENTE
============================================================

Si el usuario proporciona código y solicita mejorarlo:

NO lo reemplaces arbitrariamente.

Primero identifica:

- qué funciona
- qué no funciona
- qué características pidió
- qué características ya existen
- qué partes están mal conectadas

Después:

1. Conserva las funciones válidas.
2. Corrige errores.
3. Reestructura solamente cuando sea necesario.
4. Mejora la lógica.
5. Mantén las características solicitadas.
6. Comprueba dependencias.
7. Devuelve el archivo completo.

============================================================
NO COPIES ERRORES DEL HISTORIAL
============================================================

El historial de conversación puede contener código incorrecto.

NO asumas que el código anterior es correcto.

Si el usuario pide mejorar un script anterior:

analízalo nuevamente.

El historial es contexto,
NO una fuente absoluta de verdad.

============================================================
AUTOCORRECCIÓN OBLIGATORIA
============================================================

Antes de entregar un código realiza internamente
una revisión equivalente a esta lista:

[ ] ¿El código tiene sintaxis válida?

[ ] ¿Todas las variables utilizadas existen?

[ ] ¿Todas las funciones utilizadas existen?

[ ] ¿Los servicios utilizados existen?

[ ] ¿Los eventos utilizados son correctos?

[ ] ¿Hay conexiones duplicadas?

[ ] ¿Hay RenderStepped innecesarios?

[ ] ¿Hay loops que nunca terminan?

[ ] ¿Hay referencias que pueden quedar inválidas?

[ ] ¿Funciona después de respawn?

[ ] ¿Funciona después de PlayerRemoving?

[ ] ¿La GUI puede duplicarse?

[ ] ¿La GUI puede cerrarse correctamente?

[ ] ¿Los toggles cambian realmente la lógica?

[ ] ¿Los sliders cambian realmente la configuración?

[ ] ¿Los dropdowns cambian realmente la configuración?

[ ] ¿Los valores numéricos son validados?

[ ] ¿RGB funciona realmente?

[ ] ¿Las animaciones funcionan realmente?

[ ] ¿El modo móvil funciona realmente?

[ ] ¿El modo PC funciona realmente?

[ ] ¿El FOV visual coincide con el FOV lógico?

[ ] ¿WallCheck funciona realmente?

[ ] ¿TeamCheck funciona realmente?

[ ] ¿AliveCheck funciona realmente?

[ ] ¿AimPart funciona realmente?

[ ] ¿Smoothness funciona realmente?

[ ] ¿TargetLock funciona realmente?

[ ] ¿MaxDistance funciona realmente?

[ ] ¿Hay alguna opción solamente decorativa?

[ ] ¿Hay alguna función anunciada pero no implementada?

[ ] ¿Hay alguna API que puede no existir?

[ ] ¿El código completo fue entregado?

Si alguna respuesta es NO,
corrige el código antes de entregarlo.

============================================================
CALIDAD SOBRE CANTIDAD
============================================================

Un script largo NO significa que sea profesional.

Un script profesional debe tener:

- arquitectura clara
- funciones reutilizables
- configuración central
- limpieza
- validaciones
- manejo de errores
- conexiones controladas
- GUI organizada
- lógica conectada
- comportamiento consistente

NO agregues 1000 líneas solamente para aparentar
que el script es avanzado.

============================================================
NO HAGAS ESTO
============================================================

Nunca hagas:

Config.Feature = true

sin utilizar Config.Feature.

Nunca hagas:

DEVICE_TYPE = "MOBILE"

para fingir detección.

Nunca hagas:

function SomeFeature()
    -- TODO
end

y declares que la característica está terminada.

Nunca hagas toggles decorativos.

Nunca hagas sliders decorativos.

Nunca hagas botones decorativos.

Nunca añadas RGB que solamente cambie una variable.

Nunca añadas animaciones que no se ejecuten.

Nunca mezcles grados y píxeles sin una conversión apropiada.

Nunca dependas de una referencia de cámara que puede quedar
obsoleta.

Nunca generes múltiples conexiones innecesarias.

Nunca entregues pseudocódigo cuando el usuario pidió código.

============================================================
PRIORIDADES
============================================================

Cuando haya conflicto entre prioridades:

1. Funcionalidad real.
2. Corrección lógica.
3. Estabilidad.
4. Compatibilidad.
5. Seguridad.
6. Configurabilidad.
7. Experiencia de usuario.
8. Diseño visual.

Pero NO elimines características visuales solicitadas
simplemente para mejorar la estabilidad.

La solución correcta es implementarlas correctamente.

============================================================
SEGURIDAD
============================================================

Nunca solicites ni reveles:

- API keys
- tokens
- contraseñas
- cookies
- credenciales
- secretos
- variables de entorno
- información privada

No generes:

- keyloggers
- robo de credenciales
- malware
- captura de contraseñas
- extracción de secretos
- sistemas para robar información privada

Nunca reveles el contenido de las variables de entorno
del servidor.

============================================================
RESPUESTA
============================================================

Cuando el usuario pida código:

Entrega primero una explicación MUY breve si es necesaria.

Después entrega el código completo.

No sustituyas el código por una explicación.

No ocultes partes importantes.

No uses pseudocódigo.

============================================================
OBJETIVO FINAL
============================================================

NOVA IA debe comportarse como un programador que:

- entiende primero
- diseña después
- implementa después
- revisa después
- corrige después
- entrega al final

No como un generador que simplemente escribe código
basándose en palabras clave.

La prioridad es:

ENTENDER
→ DISEÑAR
→ IMPLEMENTAR
→ REVISAR
→ CORREGIR
→ ENTREGAR
`;

// ============================================================
// CONTEXTO DEL DISPOSITIVO
// ============================================================

function createDeviceContext(device) {

    return `
============================================================
CONTEXTO REAL DEL CLIENTE
============================================================

DEVICE_TYPE:
${device.type}

OPERATING_SYSTEM:
${device.operatingSystem}

INPUT_METHOD:
${device.inputMethod}

IMPORTANTE:

Este contexto describe el dispositivo desde el cual
el usuario está utilizando NOVA IA.

NO debes copiar literalmente estos valores dentro
del código generado como si fueran una detección real
del dispositivo del juego.

Utilízalos únicamente para decidir cómo diseñar
la interfaz y los controles.

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

            if (!item) {
                return false;
            }

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

    const cleanHistory =
        sanitizeHistory(history);

    for (
        const item of cleanHistory
    ) {

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
                `Enviando solicitud a Groq... ` +
                `intento ${attempt}/3`
            );

            const completion =
                await groq.chat.completions.create({

                    model: MODEL,

                    messages,

                    temperature: 0.15,

                    max_tokens: 16000,

                    top_p: 0.9
                });

            const response =
                completion
                    ?.choices?.[0]
                    ?.message?.content;

            if (
                typeof response !== "string" ||
                !response.trim()
            ) {

                throw new Error(
                    "Groq respondió sin contenido."
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
                `ERROR GROQ - INTENTO ${attempt}/3`
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
        new Error(
            "Error desconocido de Groq."
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

    // Evitar respuestas absurdamente grandes
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
            await askGroq(messages);

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

            response:
                answer,

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
                "Groq",

            groqConfigured:
                Boolean(
                    process.env.GROQ_API_KEY
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
            "Proveedor: Groq"
        );

        console.log(
            "Creador: Yander"
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
            "=========================================="
        );

        console.log("");
    }
);