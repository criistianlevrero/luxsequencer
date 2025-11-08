# Generador de Textura de Escamas

Una aplicación web interactiva para generar y animar texturas de escamas en tiempo real. Diseñada para artistas visuales, VJs y creativos, esta herramienta ofrece un control profundo sobre la apariencia de la textura y está completamente integrada con dispositivos MIDI para una manipulación táctil y performática.

## Características Principales

-   **Personalización en Tiempo Real:** Modifica parámetros como el tamaño, espaciado, forma y rotación de las escamas y observa los cambios al instante.
-   **Animación de Gradientes:** Diseña gradientes de color personalizados y anímalos a través de la textura. Controla la velocidad y la dirección para crear patrones de movimiento fluidos.
-   **Transformación de Formas:** Transforma suavemente la forma de las escamas desde círculos a cuadrados y estrellas de 4 puntas, permitiendo una gran variedad de estilos visuales.
-   **Sistema de Patrones (Memorias):** Guarda tus configuraciones favoritas como patrones. Carga patrones con un clic o dispáralos a través de notas MIDI. Las transiciones entre patrones son animadas y fluidas.
-   **Integración MIDI Completa:**
    -   **MIDI Learn:** Asigna cualquier control deslizante a un potenciómetro o fader de tu controlador MIDI con solo dos clics.
    -   **Disparo de Patrones:** Asigna notas MIDI a tus patrones guardados para cambiarlos al vuelo.
    -   **Creación Rápida:** Crea un nuevo patrón simplemente manteniendo pulsada una nota MIDI durante medio segundo.
-   **Modo Pantalla Completa:** Optimizado para performance en vivo, con una interfaz mínima que aparece al mover el ratón.
-   **Gestión de Sesiones:** Exporta e importa toda tu configuración (patrones y mapeos MIDI) a un archivo `.json` para guardar tu trabajo y no perderlo al recargar la página.

## Instalación y Desarrollo

### Prerrequisitos

- Node.js (v18 o superior)
- npm o yarn

### Configuración Inicial

1. Clona el repositorio:
   ```bash
   git clone https://github.com/criistianlevrero/visual-patterns-rt-tool.git
   cd visual-patterns-rt-tool
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` para personalizar tu configuración. Ver [Guía de Variables de Entorno](docs/ENVIRONMENT_VARIABLES.md) para más detalles.

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abre tu navegador en `http://localhost:3000`

### Variables de Entorno

El proyecto utiliza variables de entorno para configuración. Las más importantes son:

- `VITE_DEBUG_MODE`: Activa el overlay de debug (default: `false`)
- `VITE_MIDI_AUTO_CONNECT`: Conecta automáticamente dispositivos MIDI (default: `true`)
- `VITE_MAX_FPS`: Máximo FPS para renderizado (default: `60`)

Para más detalles, consulta la [documentación completa de variables de entorno](docs/ENVIRONMENT_VARIABLES.md).

### Scripts Disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Compila para producción
npm run preview  # Previsualiza build de producción
```

## ¿Cómo se Usa?

### 1. Controles de Textura
-   Usa los controles deslizantes en la sección **"Controles de Textura"** para ajustar la apariencia base de las escamas.
-   Experimenta con el control **"Forma de Escama"** para transformar la geometría de las partículas.

### 2. Gradiente y Animación
-   En la sección **"Gradiente y Animación"**, puedes añadir, eliminar y modificar los colores del gradiente que rellena las escamas.
-   Ajusta la **Velocidad** y **Dirección** para controlar cómo se mueve el gradiente a través de la textura.

### 3. Patrones (Memorias)
-   **Guardar un Patrón:**
    -   **Manual:** Haz clic en el botón **"Guardar Patrón Actual"**.
    -   **MIDI:** Mantén pulsada una nota en tu teclado MIDI durante 0.5 segundos.
-   **Cargar un Patrón:** Haz clic en el nombre de un patrón guardado en la lista. La transición desde el estado actual al del patrón se animará según la "Velocidad de Interpolación".
-   **Asignar MIDI a un Patrón:** Haz clic en el icono de MIDI (`MidiIcon`) junto a un patrón y luego pulsa la nota que quieras asignarle. Para borrar la asignación, vuelve a hacer clic en el icono.

### 4. Control MIDI
1.  **Conectar:** En **"Configuración MIDI"**, haz clic en "Conectar MIDI" y selecciona tu dispositivo del menú desplegable.
2.  **Mapear un Control:**
    -   Haz clic en el icono de MIDI (`MidiIcon`) junto al control deslizante que quieras mapear. El icono se volverá naranja y parpadeará.
    -   Mueve un potenciómetro o fader en tu controlador. El mapeo se asignará automáticamente y el icono se volverá cian.
    -   Para borrar un mapeo, simplemente haz clic de nuevo en el icono cian.

### 5. Guardar tu Trabajo
-   Usa la sección **"Gestión de Datos"** para **Exportar** tu configuración actual a un archivo.
-   Si la página se recarga o quieres continuar tu trabajo más tarde, usa el botón **Importar** para cargar el archivo guardado.

## Licencia

Este proyecto está licenciado bajo la **GNU General Public License v3.0**. Consulta el archivo `LICENSE` para más detalles.

## Tecnología Utilizada

-   React
-   Tailwind CSS
-   Web MIDI API
-   SVG para el renderizado
