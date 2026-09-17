/**
 * Interacciones interactivas para diagramas Mermaid en MkDocs Material:
 * - Pan & Zoom (Arrastrar y zoom con la rueda del ratón)
 * - Controles de barra de herramientas (+, -, Reset, Pantalla Completa)
 * - Sincronización reactiva con Modo Oscuro / Modo Claro
 */

document.addEventListener("DOMContentLoaded", () => {
  initDiagramInteractions();
});

// Soporte para navegación instantánea de MkDocs Material
if (typeof app !== "undefined" && app.document$) {
  app.document$.subscribe(() => {
    initDiagramInteractions();
  });
}

function initDiagramInteractions() {
  // Esperar a que Mermaid renderice los SVGs
  const checkMermaidRendered = setInterval(() => {
    const svgs = document.querySelectorAll(".mermaid svg");
    if (svgs.length > 0) {
      clearInterval(checkMermaidRendered);
      setupInteractiveDiagrams();
    }
  }, 150);

  // Detener el sondeo tras 5 segundos si no hay diagramas
  setTimeout(() => clearInterval(checkMermaidRendered), 5000);
}

function setupInteractiveDiagrams() {
  const mermaidBlocks = document.querySelectorAll(".mermaid");

  mermaidBlocks.forEach((block) => {
    // Evitar inicializar dos veces el mismo bloque
    if (block.closest(".mermaid-container")) return;

    const svg = block.querySelector("svg");
    if (!svg) return;

    // Crear el contenedor interactivo
    const container = document.createElement("div");
    container.className = "mermaid-container";

    const viewport = document.createElement("div");
    viewport.className = "diagram-viewport";

    // Barra de herramientas flotante
    const toolbar = document.createElement("div");
    toolbar.className = "diagram-toolbar";
    toolbar.innerHTML = `
      <button class="diagram-btn btn-zoom-in" title="Acercar (+)">➕</button>
      <button class="diagram-btn btn-zoom-out" title="Alejar (-)">➖</button>
      <button class="diagram-btn btn-reset" title="Restablecer vista">↺</button>
      <button class="diagram-btn btn-fullscreen" title="Pantalla completa">⛶</button>
    `;

    // Reorganizar el DOM
    block.parentNode.insertBefore(container, block);
    viewport.appendChild(block);
    container.appendChild(toolbar);
    container.appendChild(viewport);

    // Estado del Pan & Zoom
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const updateTransform = () => {
      svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    };

    const resetView = () => {
      scale = 1;
      translateX = 0;
      translateY = 0;
      updateTransform();
    };

    // Eventos de botones
    toolbar.querySelector(".btn-zoom-in").addEventListener("click", () => {
      scale = Math.min(scale + 0.25, 4.0);
      updateTransform();
    });

    toolbar.querySelector(".btn-zoom-out").addEventListener("click", () => {
      scale = Math.max(scale - 0.25, 0.4);
      updateTransform();
    });

    toolbar.querySelector(".btn-reset").addEventListener("click", resetView);

    toolbar.querySelector(".btn-fullscreen").addEventListener("click", () => {
      container.classList.toggle("is-fullscreen");
      const isFull = container.classList.contains("is-fullscreen");
      toolbar.querySelector(".btn-fullscreen").textContent = isFull ? "✖" : "⛶";
      resetView();
    });

    // Salir de pantalla completa con tecla Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && container.classList.contains("is-fullscreen")) {
        container.classList.remove("is-fullscreen");
        toolbar.querySelector(".btn-fullscreen").textContent = "⛶";
        resetView();
      }
    });

    // Zoom con rueda del ratón
    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      scale = Math.min(Math.max(scale + delta, 0.4), 4.0);
      updateTransform();
    }, { passive: false });

    // Arrastre con ratón (Pan)
    viewport.addEventListener("mousedown", (e) => {
      // Ignorar clics en enlaces dentro del SVG
      if (e.target.closest("a")) return;
      isDragging = true;
      viewport.classList.add("is-dragging");
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        viewport.classList.remove("is-dragging");
      }
    });
  });
}
