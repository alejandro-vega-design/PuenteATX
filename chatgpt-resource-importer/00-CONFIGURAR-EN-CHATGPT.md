# Configurar el asistente de importación de Puente ATX

Este paquete permite crear un GPT personalizado reutilizable en varias conversaciones de ChatGPT.

## Crear el GPT

1. Abre ChatGPT.
2. Entra a **Explore GPTs** y selecciona **Create**.
3. Usa como nombre: **Preparar recursos Puente ATX**.
4. Copia todo el contenido de `CUSTOM-GPT-INSTRUCTIONS.md` en el campo **Instructions**.
5. En **Knowledge**, sube estos archivos:
   - `PUENTE-ATX-IMPORT-SCHEMA.md`
   - `PUENTE-ATX-QUALITY-RULES.md`
   - `puente-atx-import-template.csv`
6. Habilita **Web Search** para poder verificar información en sitios oficiales.
7. Habilita **Code Interpreter & Data Analysis** para leer DOCX, PDF, XLSX y producir CSV descargables.
8. Guarda el GPT como privado o compártelo únicamente con personas autorizadas.

## Uso

En cualquier conversación nueva con ese GPT:

> Prepara este documento para importarlo en Puente ATX. Consolida duplicados, completa ambos idiomas y entrega el CSV junto con un reporte de revisión.

Adjunta luego uno o más archivos CSV, XLSX, DOCX o PDF.

## Limitación importante

Este paquete refleja el importer de Puente ATX al **18 de agosto de 2026**. ChatGPT no puede consultar automáticamente el repositorio local. Si cambia el esquema del importer, reemplaza los archivos de conocimiento y la plantilla por versiones actualizadas.

El GPT prepara borradores para revisión administrativa. Nunca debe importar, publicar ni modificar producción automáticamente.
