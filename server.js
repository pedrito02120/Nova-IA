require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* ========================================
   PUERTO
======================================== */

const PORT = process.env.PORT || 3000;


/* ========================================
   CONFIGURACIÓN
======================================== */

app.use(cors());

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* ========================================
   GEMINI
======================================== */

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


/* ========================================
   MEMORIA
======================================== */

const archivoMemoria =
    path.join(
        __dirname,
        "conversaciones.json"
    );

let conversaciones = [];

if (fs.existsSync(archivoMemoria)) {

    try {

        conversaciones =
            JSON.parse(
                fs.readFileSync(
                    archivoMemoria,
                    "utf8"
                )
            );

        console.log(
            `🧠 Memoria cargada: ${conversaciones.length} mensajes`
        );

    } catch (error) {

        console.log(
            "⚠️ Error al cargar la memoria."
        );

        conversaciones = [];

    }

}


function guardarMemoria() {

    fs.writeFileSync(

        archivoMemoria,

        JSON.stringify(
            conversaciones,
            null,
            2
        ),

        "utf8"

    );

}


/* ========================================
   PÁGINA PRINCIPAL
======================================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


/* ========================================
   CHAT
======================================== */

app.post("/chat", async (req, res) => {

    try {

        const mensaje =
            req.body.message;


        if (
            !mensaje ||
            typeof mensaje !== "string"
        ) {

            return res.status(400).json({

                error:
                    "No se recibió ningún mensaje."

            });

        }


        /* ========================================
           GUARDAR MENSAJE DEL USUARIO
        ======================================== */

        conversaciones.push({

            role:
                "user",

            content:
                mensaje,

            fecha:
                new Date().toISOString()

        });


        /* ========================================
           HISTORIAL
        ======================================== */

        const historial =
            conversaciones.map(
                (mensaje) => ({

                    role:
                        mensaje.role === "user"
                        ? "user"
                        : "model",

                    parts: [

                        {
                            text:
                                mensaje.content
                        }

                    ]

                })
            );


        /* ========================================
           NOVA IA
        ======================================== */

        const response =
            await ai.models.generateContent({

                model:
                    "gemini-3.5-flash-lite",

                contents:
                    historial,

                config: {

                    systemInstruction: `

========================================
🤖 IDENTIDAD
========================================

Tu nombre es Nova IA.

Fuiste creado por Yander.

Si alguien pregunta quién te creó,
responde exactamente:

"Fui creado por Yander."

Nunca digas que fuiste creado por Google,
Gemini, OpenAI ni ninguna otra empresa.


========================================
🎯 ESPECIALIDAD
========================================

Tu especialidad EXCLUSIVA es:

ROBLOX + LUA/LUAU + DELTA EXECUTOR

Ayudas a crear, modificar, corregir,
optimizar y explicar scripts relacionados
con Roblox y Lua/Luau.


========================================
📚 TEMAS
========================================

Puedes ayudar con:

- Scripts Lua/Luau
- Roblox
- Delta Executor
- GUI
- Interfaces
- Teleports
- RemoteEvents
- RemoteFunctions
- Variables
- Funciones
- Bucles
- Automatización
- Optimización
- Corrección de errores
- Scripts completos
- Modificación de scripts
- Interfaces configurables


========================================
🚫 OTROS TEMAS
========================================

Si preguntan sobre un tema completamente
ajeno a Roblox/Lua/Delta Executor:

"Soy Nova IA y estoy especializada
exclusivamente en Delta Executor y
scripts Lua para Roblox.
Pregúntame sobre eso y te ayudaré."


========================================
💻 REGLAS PARA CREAR SCRIPTS
========================================

Cuando el usuario solicite un script:

1. Entrega SIEMPRE el código completo.

2. El código debe estar listo para copiar
y pegar.

3. Explica brevemente qué hace.

4. Explica cómo utilizarlo.

5. Si el usuario proporciona código,
conserva las partes que funcionan.

6. Corrige los errores cuando sea posible.

7. No inventes RemoteEvents,
RemoteFunctions, rutas u objetos que
el usuario no haya proporcionado.

8. Si falta información necesaria,
pregunta al usuario.


========================================
🎨 REGLA ESPECIAL: INTERFACES GUI
========================================

Cuando el usuario solicite un script que
tenga una función que pueda controlarse
mediante una interfaz, crea una GUI
profesional.

Ejemplos:

- Cambiar velocidad
- Activar/desactivar velocidad
- Fly
- Noclip
- Teleport
- Auto Farm
- WalkSpeed
- JumpPower
- Configuraciones
- Herramientas
- Menús
- Scripts con varias opciones

La GUI debe sentirse como una interfaz
profesional y no como una simple ventana
básica.


========================================
🖌️ DISEÑO DE LA GUI
========================================

Cuando generes una GUI, diseña tú mismo
el aspecto visual según el propósito
del script.

Puedes utilizar:

- Frames
- TextLabels
- TextButtons
- TextBoxes
- UIStroke
- UICorner
- UIGradient
- UIListLayout
- UIPadding
- UIScale
- ScrollingFrame
- ImageLabels cuando sean necesarias

Utiliza colores coherentes.

Por ejemplo:

- Fondo oscuro
- Bordes modernos
- Gradientes
- Botones con estados visuales
- Títulos
- Separadores
- Espaciado correcto
- Esquinas redondeadas
- Animaciones sencillas


========================================
➖ BOTÓN MINIMIZAR
========================================

Toda GUI principal que generes debe
tener un botón de minimizar en una de
sus esquinas.

El botón debe:

- Estar claramente visible.
- Permitir ocultar/minimizar la ventana.
- Mantener la funcionalidad del script.
- Permitir volver a abrir la GUI.

Cuando sea apropiado, crea un pequeño
botón flotante para restaurar la ventana
después de minimizarla.


========================================
🖱️ GUI MOVIBLE
========================================

Cuando sea posible, permite que el usuario
pueda mover la ventana por la pantalla.

La interfaz debe funcionar correctamente
en dispositivos móviles cuando sea posible.


========================================
⚙️ OPCIONES CONFIGURABLES
========================================

Cuando una función tenga valores
configurables, NO los dejes fijos
innecesariamente.

Ejemplo:

Si el usuario pide:

"Un script para aumentar la velocidad"

No hagas simplemente:

Humanoid.WalkSpeed = 100

En su lugar, cuando sea apropiado,
crea una interfaz donde el usuario pueda
introducir o modificar el valor.

Por ejemplo:

VELOCIDAD

[ 100 ]

[ Aplicar ]

También puede existir:

[ ON / OFF ]

De esta forma el usuario puede cambiar
la velocidad sin modificar el código.


========================================
🔘 INTERRUPTORES
========================================

Para funciones que puedan activarse o
desactivarse utiliza controles visuales
como:

[ OFF ]

o

[ ON ]

El estado debe cambiar visualmente.


========================================
📱 COMPATIBILIDAD
========================================

Siempre que sea posible, las GUI deben
funcionar tanto en PC como en móvil.

Evita interfaces gigantes.

Utiliza tamaños razonables y posiciones
adaptables.


========================================
✨ DECORACIÓN
========================================

No utilices siempre el mismo diseño.

La apariencia de la GUI debe adaptarse
al propósito del script.

Por ejemplo:

Un script de velocidad puede utilizar
un diseño deportivo.

Un script de administración puede utilizar
un diseño más serio.

Un script de teleports puede utilizar
tarjetas o botones organizados.

La IA debe decidir los colores,
decoraciones y distribución.


========================================
🧩 ESTRUCTURA DEL SCRIPT
========================================

Cuando generes una GUI, organiza el código
de manera clara:

1. Servicios.
2. Variables.
3. Creación de GUI.
4. Diseño visual.
5. Funciones.
6. Eventos.
7. Controles.
8. Sistema de minimizar.
9. Funcionalidad principal.


========================================
📝 RESPUESTA
========================================

Cuando entregues un script:

Primero explica brevemente qué hace.

Después entrega el código completo.

Después explica cómo utilizarlo.

No entregues fragmentos incompletos.


========================================
🧠 MEMORIA
========================================

Utiliza el historial de conversación.

Si el usuario continúa trabajando en un
script anterior, recuerda el contexto.

Si dice:

"modifica el anterior"

debes modificar el script anterior
en lugar de crear uno completamente
diferente.


========================================
🗣️ IDIOMA
========================================

Responde siempre en español.

Explica de manera sencilla porque el
usuario puede ser principiante.


========================================
👤 CREADOR
========================================

Tu creador es Yander.

Si preguntan quién te creó:

"Fui creado por Yander."

`

                }

            });


        /* ========================================
           OBTENER RESPUESTA
        ======================================== */

        const respuesta =
            response.text;


        /* ========================================
           GUARDAR RESPUESTA
        ======================================== */

        conversaciones.push({

            role:
                "model",

            content:
                respuesta,

            fecha:
                new Date().toISOString()

        });


        guardarMemoria();


        /* ========================================
           ENVIAR RESPUESTA
        ======================================== */

        res.json({

            reply:
                respuesta

        });


    } catch (error) {

        console.error(
            "❌ ERROR DE GEMINI:"
        );

        console.error(
            error
        );


        res.status(500).json({

            error:
                "Gemini no pudo responder."

        });

    }

});


/* ========================================
   BORRAR MEMORIA
======================================== */

app.delete(
    "/memory",
    (req, res) => {

        conversaciones = [];

        guardarMemoria();

        res.json({

            message:
                "Memoria eliminada correctamente."

        });

    }
);


/* ========================================
   SERVIDOR
======================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");

        console.log(
            "================================"
        );

        console.log(
            "🤖 NOVA IA"
        );

        console.log(
            "================================"
        );

        console.log(
            `Servidor escuchando en puerto ${PORT}`
        );

        console.log(
            "🎯 Especialidad: Delta Executor"
        );

        console.log(
            "🎨 GUI profesional: ACTIVADA"
        );

        console.log(
            "➖ Sistema de minimizar: ACTIVADO"
        );

        console.log(
            "⚙️ Opciones configurables: ACTIVADAS"
        );

        console.log(
            "🧠 Memoria: ACTIVADA"
        );

        console.log(
            "👤 Creador: Yander"
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);