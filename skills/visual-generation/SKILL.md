---
name: visual-generation
description: Record an image, a video, or a 3D model only after a runtime returns the file. A missing runtime stays skipped.
license: MIT; see NOTICE.md and licenses/ui-skills.txt. ComfyUI, Remotion, and video-use are references and are not bundled.
compatibility: Native agent host with an image tool, or a local ComfyUI, Remotion, or video runtime already installed by the operator.
metadata:
  author: oh-my-grokbot
  version: "0.1.0"
  verification: reviewed
---

# visual-generation

Use when the art director needs a picture, and use the same receipt when the brief also asks for a video or a 3D model. Write the component function and the core information before generating. Do not invent pixels, a duration, a mesh, or a hash.

1. Image. Call the native host image tool when it returns a file. If it does not, use a local ComfyUI the operator has already installed. Record the runtime name, its version, the prompt that was sent, the output path, and the SHA-256 of that file. When neither runtime is present, set the image entry to skipped. A skipped entry is not a still.
2. Video. Call Remotion, video-use, or a ComfyUI video graph only when that runtime is present and returns a file. Record the same fields. A storyboard is not a rendered video. A missing runtime stays skipped.
3. Model. A model is a mesh or scene file, glTF or OBJ, from a local runtime the operator named. Record the runtime and the file hash. A missing runtime stays skipped. Do not invent geometry.

Write `visual-receipt.json` with one entry for each requested kind. Each entry has `kind` (`image`, `video`, or `model`), `status` (`created` or `skipped`), `runtime`, `prompt`, `outputPath`, and `sha256`. `created` requires the hash of a non-empty file that exists. `skipped` has an empty hash and names the missing runtime.

See [NOTICE.md](NOTICE.md).
