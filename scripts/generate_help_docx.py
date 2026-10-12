import zipfile
import os

def create_docx(filename):
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="2B2B2B"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>"""

    document = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="48"/><w:color w:val="1E3A5F"/></w:rPr><w:t>VUE 3D Canvas</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="400"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="26"/><w:color w:val="555555"/></w:rPr><w:t>Software Documentation &amp; Technical Reference Manual</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="400"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="333333"/></w:rPr><w:t>Author &amp; Creator: Victory Ukpong</w:t></w:r>
    </w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>1. Architecture &amp; Core Constraints</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>VUE 3D Canvas is an ultra-lightweight, professional-grade 3D model texturing and digital painting workstation. Built with a Rust core, WebAssembly compilation target, and DirectX 11 / OpenGL 2.0 native Windows desktop targets, it maintains a strictly constrained memory footprint designed for high stability and fast execution without raytracing dependencies.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Key specifications include: (1) .xblend custom format with external linked mesh assets by default; (2) A deterministic 3-state undo ring buffer recorded to file; (3) Adobe Photoshop CS5 dark gray workstation UI palette (#333333, #2b2b2b, #3c3c3c); (4) Autodesk Sketchbook / MediBang dockable tab groups and circular brush wheel.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>2. Main Viewport &amp; Navigation Controls</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>VUE 3D Canvas provides a unified multi-viewport environment supporting Perspective Orbit, Orthographic Axis Alignment, Quad Split View (Top, Front, Right, 3D), and a dedicated 2D UV Texture Map Canvas.</w:t></w:r></w:p>
    <w:p><w:r><w:b/><w:t>Navigation Keybindings:</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Orbit: Middle Mouse Button (MMB) or Alt + Left Mouse Drag.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Pan: Shift + MMB or Spacebar + Drag.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Zoom: Mouse Scroll Wheel or Ctrl + MMB Drag.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Numpad 1: Front View (Ctrl+1 for Back View).</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Numpad 3: Right View (Ctrl+3 for Left View).</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Numpad 7: Top View (Ctrl+7 for Bottom View).</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Numpad 5: Toggle Perspective / Orthographic projection.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Touch Nav (Android / Stylus): Dedicated toggle allows finger touch for orbiting/panning while stylus paints on canvas.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>3. Symmetry Tool Docker &amp; Symmetrize Engine</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>The Symmetry Tool Window Docker allows bilateral cloning and mirror painting across any chosen coordinate axis (X, Y, or Z).</w:t></w:r></w:p>
    <w:p><w:r><w:b/><w:t>Parameters and Features:</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Axis Selector: Choose X, Y, or Z axis as mirror plane.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Clone Direction: Select '+ to -' (overwrites left from right side) or '- to +' (overwrites right from left side).</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Origin Determination: Option 1 uses standard Mesh Origin (0,0,0); Option 2 enables a Virtual Origin 3D Cursor.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Axis Locator Position: Slider and numeric input field to place the symmetry plane interactively along the selected axis (-1.0 to +1.0).</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Virtual Cursor Plane: Toggles visual semi-transparent slice plane and crosshair in the 3D viewport.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Real-time Mirror Painting: Paints bilateral brush dabs synchronously across the symmetry plane.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Symmetrize Action Button: Executes instant pixel cloning onto the opposite side for active layer or all visible layers.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Right-Click Toolbar Action: Right-clicking the symmetry button in the top options bar opens the Symmetry Docker directly.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>4. Mask Painting Docker &amp; Physical Selectors</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>All selection tools act as physical 2D plane masks on the active texture. When a selection is present, all painting operations in both 2D and 3D viewports are strictly clipped to within the selection bounds, leaving outside areas protected.</w:t></w:r></w:p>
    <w:p><w:r><w:b/><w:t>Selector Tools:</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Rectangular Marquee (M): Drags rectangular bounding box mask.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Freehand Lasso (L): Freehand polygonal boundary selection.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Polygon Lasso (Alt+L): Click-by-click straight segment polygon.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Pen Tool (P): Vector curve path tool with click to add points, closing loops, and right-click context menu.</w:t></w:r></w:p>
    <w:p><w:r><w:b/><w:t>Mask Operations:</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Invert Mask: Inverts inside/outside status.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Expand (Dilate): Expands mask boundary by 1 to 24 pixels.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Shrink (Erode): Shrinks mask boundary by 1 to 24 pixels.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Blur / Feather: Softens mask boundaries by 1 to 32 pixels.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Fill / Erase Selection: Instantly floods or clears pixels enclosed by the mask on the active layer.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Layer Alpha to Mask: Derives selection boundary directly from non-transparent pixels on active layer.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>5. Pen Vector Curve Tool</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>The Pen Curve Tool functions as a vector spline tool on the 2D UV Canvas. Users click to drop curve nodes and close loops.</w:t></w:r></w:p>
    <w:p><w:r><w:b/><w:t>Right-Click Context Menu Actions:</w:t></w:r></w:p>
    <w:p><w:r><w:t>1. Distribute Brush Along Path: Strokes the curve using current brush tip spacing, scatter, and opacity.</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. Fill Curve Area with Color: Floods the area enclosed by the curve with foreground color.</w:t></w:r></w:p>
    <w:p><w:r><w:t>3. Erase Curve Area: Clears pixels inside the enclosed curve loop.</w:t></w:r></w:p>
    <w:p><w:r><w:t>4. Convert Curve to Selector Mask: Converts curve nodes into an active physical selection mask.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>6. Triplanar Filter Suite</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>Located under Filter &gt; Triplanar Box Mapping Fill (Shift+T):</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Projection Logic: UV-less X, Y, and Z box projections utilizing YZ, XZ, and XY coordinate spaces.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Normal-Based Weights: Normalized projection blending with adjustable sharpness power (1.0 to 12.0).</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Slope Mask: Threshold (0..1), smoothing range, strength multiplier, inversion, and configurable normal up-direction.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Altitude Mask: Lower and upper elevation bounds (-2.0 to +2.0), smoothing, and inversion.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Height-Aware Blending: Blends textures based on height map contrast with fallback when unavailable.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>7. Gaussian Blur Tool</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>Located under Filter &gt; Gaussian Blur (Ctrl+F):</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Scope: Strictly blurs the selected layer's texture, preserving all other layers intact.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Convolution: High-speed separable 1D horizontal and vertical convolution passes.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Radius: 0.1 to 250 pixels.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Presets: Low (7x7 kernel), Medium (15x15 kernel), High (31x31 kernel).</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Alpha Preservation: Premultiplied alpha weighting prevents black edge fringing.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Non-Destructive Workflow: Preview, Apply, and Cancel with full undo/redo registration.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>8. Stochastic Layer Scattering</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>Located under Filter &gt; Stochastic Layer Scattering:</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Repeat Mode: When number_of_repeats &gt; 0, uses repeat-aware distribution to reduce visible pattern repetition.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Stochastic Mode: When number_of_repeats = 0, uses non-repeating continuous distribution.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Parameters: Stamp density, edge blend contrast, scatter strength, deterministic seed, rotation range, scale range, and blend modes (Normal, Multiply, Overlay, Add).</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>9. Jenny Stitch Studio</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>Located under Filter &gt; Jenny Stitch Studio:</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Mesh Topology Adjacency: Traverses 3D mesh vertex edges and UV seam charts using A* pathfinding.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Controls: Stitch spacing, rotation offset, displacement depth, thread shaders, stitch density, path smoothing, thread and shadow colors.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>10. Layer Conversions &amp; Channel Tools</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>Accessible from the Layers menu and Layer Manager context menu:</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Convert to Bump Map (Height): Converts RGB luminance to 8-bit normalized height data.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Convert to Normal Map (Sobel RGB): Generates tangent-space normal maps [R=X, G=Y, B=Z] using a 3x3 Sobel gradient filter.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Convert to Alpha Clip Mask: Thresholds active layer into binary opacity channel [0 or 255].</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2A4D69"/></w:rPr><w:t>11. Undo / Redo Preferences Settings</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>Integrated into Edit &gt; Undo &amp; Redo Settings (Ctrl+K):</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Runtime History States: Slider and number input field to customize in-memory undo buffer capacity (3 to 120 states).</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Memory Informatics: Computes estimated runtime RAM footprint in megabytes based on active layer count.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Portability Constraint: When saving to .xblend format, the application embeds the 3 most recent states to ensure strict low-memory cross-platform portability.</w:t></w:r></w:p>

    <w:p><w:pPr><w:spacing w:before="400" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="777777"/></w:rPr><w:t>VUE 3D Canvas · Created by Victory Ukpong · Open Source</w:t></w:r>
    </w:p>
  </w:body>
</w:document>"""

    with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', content_types)
        docx.writestr('_rels/.rels', rels)
        docx.writestr('word/_rels/document.xml.rels', doc_rels)
        docx.writestr('word/document.xml', document)
        docx.writestr('word/styles.xml', styles)

if __name__ == '__main__':
    create_docx('help.docx')
    os.makedirs('public', exist_ok=True)
    create_docx('public/help.docx')
    print("Generated help.docx and public/help.docx successfully")
