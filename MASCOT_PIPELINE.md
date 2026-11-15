# Mascot generation pipeline

Build and validate these stages one by one.

1. **Image validation (deferred)**: Use Sharp for image metadata, orientation, and quality checks. Implement this later; start with Stage 2.
2. **Face detection**: Use MediaPipe Face Landmarker with its WASM runtime and model to detect facial landmarks.
   The current TensorFlow.js detector produces a landmark overlay.
3. **Geometry analysis**: Calculate face proportions and feature positions from the landmarks.
   The specification uses face-box width / height and image-space distances divided by face-box width. Eye spacing is between eye-corner midpoints (33, 133 and 362, 263); nose width uses points 98 and 327; mouth width uses points 61 and 291. These are approximate projected ratios, not physical measurements.
4. **Visual analysis agent**: Use a vision-capable model to describe visible face shape, proportions, eyes, eyebrows, nose, lips, hair, facial hair, expression, and distinctive features. Face shape and eyes include subjective confidence scores from 0 to 1; unclear or unseen details are recorded in `uncertainties`.
5. **Character specification**: Merge geometric measurements and visual descriptions into validated JSON. Missing optional measurements are omitted and listed in `uncertainties`.
6. **SVG generation and refinement**: Use the Copilot SDK with the original photo, landmark overlay, fixed style reference, and character specification to generate a renderable SVG. The reference guides style only, not the person's appearance. Evaluation and iterative refinement remain future work.

The HTTP response returns `{ success: true, data: { svg } }`; the socket event `room:convertImageToCartoon:landmarks` emits the same data object. The character specification is used internally for generation. Generated SVG is model output, not sanitized for embedding as trusted markup.

For HTTP uploads, add the optional multipart field `colorMode` with `monochrome` or `color`. For the socket event `room:convertImageToCartoon`, include `colorMode` alongside `image`. The default is `monochrome`. Both styles request a transparent background and face, black outlines, and transparent hair streak cutouts; color mode preserves natural colors for hair and glasses. The fixed reference is `assets/mascot-style-reference.png` and must be deployed with the application.

Each successful generation also saves an SVG to `output/cartoon-<unique-id>.svg` relative to the server's working directory; the path is logged by the server. These files are ignored by Git and remain on disk until removed. Saving errors fail the request.

Confirm the face-landmark runtime works in the chosen environment before implementation; browser and Node.js support may differ.
