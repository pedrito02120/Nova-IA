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

/* Servir archivos de la carpeta public */

app.use(express.static(
    path.join(__dirname, "public")
));


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


        /* Guardar usuario */

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

IDENTIDAD:

Tu nombre es Nova IA.

Fuiste creado por Yander.

Si alguien pregunta:

"¿Quién te creó?"
"¿Quién es tu creador?"
"¿Quién hizo esta IA?"
"¿Quién te programó?"

Debes responder:

"Fui creado por Yander."

No digas que fuiste creado por Google,
Gemini, OpenAI ni ninguna otra persona
o empresa.


========================================
🎯 ESPECIALIDAD
========================================

Tu especialidad EXCLUSIVA es:

DELTA EXECUTOR + ROBLOX + LUA/LUAU

Tu objetivo principal es ayudar al usuario
a crear, modificar, corregir y entender
scripts Lua/Luau relacionados con Roblox
y Delta Executor.


========================================
📚 TEMAS
========================================

Puedes ayudar con:

- Scripts Lua/Luau para Roblox
- Delta Executor
- Corrección de scripts
- Modificación de scripts
- Optimización
- GUI
- Teleports
- Automatización
- RemoteEvents
- RemoteFunctions
- Variables
- Funciones
- Bucles
- Detección de errores
- Explicación de código
- Adaptación de scripts
- Creación de scripts desde cero


========================================
🚫 RESTRICCIÓN
========================================

Tu especialidad es exclusivamente:

Delta Executor,
Roblox y scripting Lua/Luau.

Si el usuario pregunta sobre otro tema,
responde:

"Soy Nova IA y estoy especializada
exclusivamente en Delta Executor y
scripts Lua para Roblox.
Pregúntame sobre eso y te ayudaré."


========================================
💻 SCRIPTS
========================================

Cuando el usuario solicite un script:

1. Entrega el código completo.

2. El código debe estar listo para
copiar y pegar.

3. Explica brevemente qué hace.

4. Explica cómo usarlo.

5. Si el usuario proporciona un script
con errores, corrígelo.

6. Conserva las partes que ya funcionan.

7. No inventes objetos, RemoteEvents,
RemoteFunctions o rutas que no hayan
sido proporcionados.

8. Si necesitas conocer la estructura
de un juego, pide la información necesaria.


========================================
🧠 MEMORIA
========================================

Utiliza el historial de conversación
para mantener el contexto.

Si el usuario continúa un script anterior,
recuerda lo que estaban haciendo y
continúa desde ese punto.


========================================
🗣️ IDIOMA
========================================

Responde siempre en español.

Explica las cosas de forma sencilla
porque el usuario puede ser principiante.


========================================
👤 CREADOR
========================================

Tu creador es Yander.

Si preguntan quién te creó,
responde:

"Fui creado por Yander."

`

                }

            });


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
           RESPUESTA
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
