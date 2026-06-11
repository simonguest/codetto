/**
 * scene3d module — main-thread (provider) side.
 *
 * Handles two via.js op types from PyodideProvider.vue:
 *   "scene3d"            — regular request/response ops (create_scene, create_mesh, …)
 *   "scene3d_wait_event" — deferred: holds viaRespond until a click event arrives
 *                          so Python's run() event loop can block cheaply.
 *
 * BabylonJS is dynamically imported only when the first scene is created,
 * keeping it out of the initial bundle for notebooks that don't use scene3d.
 */
import { viaRegister, viaGet } from "@/bridge/viaStore";
import { notebookStore } from "@store/notebookStore";
import { pyodideStore } from "@store/pyodideStore";

interface SceneController {
  engine: any;
  scene: any;
  canvas: HTMLCanvasElement;
  camera: any;
  _pendingRespond: ((result: any) => void) | null;
  _eventQueue: any[];
  _overlayHandle: number;
  _skybox: any | null;
  _followObserver: any | null;
}

const MATERIALS_BASE = "/3dassets/materials";

async function createMaterial(matConst: string, scene: any): Promise<any> {
  if (matConst.startsWith("mat-simple:")) {
    const path = matConst.slice("mat-simple:".length);
    const { StandardMaterial, Texture } = await import("@babylonjs/core");
    const mat = new StandardMaterial("mat_" + path, scene);
    mat.diffuseTexture = new Texture(`${MATERIALS_BASE}/${path}`, scene);
    return mat;
  }
  if (matConst.startsWith("mat:")) {
    const path = matConst.slice("mat:".length);
    const [folder, name] = path.split("/");
    const { PBRMaterial, Texture } = await import("@babylonjs/core");
    const mat = new PBRMaterial("mat_" + name, scene);
    mat.albedoTexture = new Texture(`${MATERIALS_BASE}/${folder}/${name}_1K_Color.jpg`, scene);
    mat.bumpTexture = new Texture(`${MATERIALS_BASE}/${folder}/${name}_1K_NormalDX.jpg`, scene);
    mat.invertNormalMapY = true; // DX normal maps have Y inverted vs OpenGL
    mat.metallicTexture = new Texture(`${MATERIALS_BASE}/${folder}/${name}_1K_Roughness.jpg`, scene);
    mat.useRoughnessFromMetallicTextureGreen = true;
    mat.metallic = 0;
    mat.roughness = 1;
    return mat;
  }
  return null;
}

function applyTiling(material: any, u: number, v: number) {
  for (const tex of (material.getActiveTextures?.() ?? [])) {
    if (tex.uScale !== undefined) {
      tex.uScale = u;
      tex.vScale = v;
    }
  }
}

function hexToColor3(hex: string, BabylonColor3: any) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return new BabylonColor3(r, g, b);
}

function dispatchEvent(controller: SceneController, event: any) {
  if (controller._pendingRespond) {
    const respond = controller._pendingRespond;
    controller._pendingRespond = null;
    respond(event);
  } else {
    controller._eventQueue.push(event);
  }
}

export async function handleScene3dOp(
  op: string,
  command: any,
  viaRespond: (result: any) => void
): Promise<boolean> {
  if (op !== "scene3d" && op !== "scene3d_wait_event") return false;

  // ── Deferred: hold the respond callback until a click or close event arrives ──
  if (op === "scene3d_wait_event") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (!controller) {
      viaRespond({ type: "closed" });
      return true;
    }
    if (controller._eventQueue.length > 0) {
      viaRespond(controller._eventQueue.shift());
    } else {
      controller._pendingRespond = viaRespond;
      // Do NOT call viaRespond here — worker stays blocked on Atomics.wait(250ms)
    }
    return true;
  }

  const { cmd } = command;

  // ── create_scene ─────────────────────────────────────────────────────────────
  if (cmd === "create_scene") {
    try {
      const {
        Engine, Scene, HemisphericLight, ArcRotateCamera,
        Vector3, Color3, Color4, MeshBuilder, StandardMaterial,
        ActionManager, ExecuteCodeAction,
      } = await import("@babylonjs/core");

      // Canvas fills the output width and maintains 16:9 via CSS.
      // No fixed pixel sizes here — BabylonJS reads clientWidth/clientHeight
      // via engine.resize() and sets the WebGL buffer to match.
      const canvas = document.createElement("canvas");
      canvas.width = 16;   // placeholder; engine.resize() sets the real size
      canvas.height = 9;
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.aspectRatio = "16 / 9";
      canvas.tabIndex = 1;  // required for ArcRotateCamera keyboard input

      // Prevent mouse-wheel zoom from also scrolling the page.
      canvas.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

      // adaptToDeviceRatio: engine.resize() multiplies clientSize by devicePixelRatio
      // so rendering stays sharp on HiDPI displays.
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        adaptToDeviceRatio: true,
      });
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0.1, 0.1, 0.1, 1.0);

      // Default light
      const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
      light.intensity = 0.9;

      // Default ArcRotateCamera — orbits around origin
      const camera = new ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 4, 12, Vector3.Zero(), scene
      );
      camera.lowerRadiusLimit = 2;
      camera.upperRadiusLimit = 50;
      camera.attachControl(canvas, true);

      // Render loop
      engine.runRenderLoop(() => scene.render());

      // 2D overlay canvas for HUD drawing — sits on top of the BabylonJS canvas.
      // pointer-events:none lets mouse events reach BabylonJS underneath.
      const dpr = window.devicePixelRatio || 1;
      const overlayCanvas = document.createElement("canvas");
      overlayCanvas.width = 16;
      overlayCanvas.height = 9;
      overlayCanvas.style.cssText =
        "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;";
      let overlayCtx: CanvasRenderingContext2D | null = null;

      const getOverlayCtx = () => {
        if (!overlayCtx) {
          overlayCtx = overlayCanvas.getContext("2d")!;
          overlayCtx.scale(dpr, dpr);
        }
        return overlayCtx;
      };

      const syncOverlay = () => {
        const w = Math.floor(overlayCanvas.clientWidth * dpr);
        const h = Math.floor(overlayCanvas.clientHeight * dpr);
        if (w > 0 && h > 0 && (overlayCanvas.width !== w || overlayCanvas.height !== h)) {
          overlayCanvas.width = w;
          overlayCanvas.height = h;
          overlayCtx = null;  // canvas resize resets context state; reapply DPR scale on next use
        }
      };

      // Proxy wraps the 2D context: all standard Canvas2D methods/properties work
      // via the generic bridge call/set ops, and clear() is added as a custom method.
      const overlayController = new Proxy({} as any, {
        get(_t, prop) {
          if (prop === "clear") {
            return () => {
              const ctx = overlayCanvas.getContext("2d")!;
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
              ctx.restore();
            };
          }
          const ctx = getOverlayCtx();
          const val = (ctx as any)[prop];
          return typeof val === "function" ? val.bind(ctx) : val;
        },
        set(_t, prop, value) {
          (getOverlayCtx() as any)[prop] = value;
          return true;
        },
      });
      const overlayHandle = viaRegister(overlayController);

      // Once the canvas is in the DOM, do an initial resize and watch for future
      // size changes. ResizeObserver on the canvas fires whenever its CSS size
      // changes (container width changed), keeping the WebGL viewport in sync.
      const resizeObserver = new ResizeObserver(() => {
        engine.resize();
        syncOverlay();
      });
      const mutObs = new MutationObserver(() => {
        if (canvas.isConnected) {
          mutObs.disconnect();
          engine.resize();
          syncOverlay();
          resizeObserver.observe(canvas);
        }
      });
      mutObs.observe(document.body, { childList: true, subtree: true });

      const controller: SceneController = {
        engine,
        scene,
        canvas,
        camera,
        _pendingRespond: null,
        _eventQueue: [],
        _overlayHandle: overlayHandle,
        _skybox: null,
        _followObserver: null,
      };

      // Wrapper div registers as the display element for CanvasResult.vue.
      // position:relative + aspect-ratio give the overlay canvas a resolved height
      // to anchor its position:absolute + height:100% against.
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "canvas-layer-wrapper";
      wrapperDiv.style.cssText = "display:block;width:100%;position:relative;aspect-ratio:16/9;";
      wrapperDiv.appendChild(canvas);
      wrapperDiv.appendChild(overlayCanvas);

      const displayHandle = viaRegister(wrapperDiv);
      const sceneHandle = viaRegister(controller);

      if (pyodideStore.runningCellId) {
        notebookStore.setResult(pyodideStore.runningCellId, {
          "application/x-via-canvas": String(displayHandle),
        });
      }

      viaRespond({ type: "value", value: sceneHandle });
    } catch (err) {
      viaRespond({ type: "error", message: String(err) });
    }
    return true;
  }

  // ── set_sky ──────────────────────────────────────────────────────────────────
  if (cmd === "set_sky") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (controller) {
      if (controller._skybox) {
        controller._skybox.dispose();
        controller._skybox = null;
      }
      if (typeof command.color === "string" && command.color.startsWith("env:")) {
        const envName = command.color.slice(4);
        const { CubeTexture, MeshBuilder, StandardMaterial, Color3, Texture } = await import("@babylonjs/core");
        // One CubeTexture instance shared between the skybox material and the scene
        // environment so PBR materials automatically pick up IBL reflections.
        const envTexture = CubeTexture.CreateFromPrefilteredData(
          `/3dassets/environments/${envName}.env`,
          controller.scene
        );
        controller.scene.environmentTexture = envTexture;
        const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000 }, controller.scene);
        const mat = new StandardMaterial("skyBoxMat", controller.scene);
        mat.backFaceCulling = false;
        mat.reflectionTexture = envTexture;
        mat.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        mat.diffuseColor = new Color3(0, 0, 0);
        mat.specularColor = new Color3(0, 0, 0);
        skybox.material = mat;
        controller._skybox = skybox;
      } else {
        const { Color4 } = await import("@babylonjs/core");
        const h = (command.color as string).replace("#", "");
        const r = parseInt(h.slice(0, 2), 16) / 255;
        const g = parseInt(h.slice(2, 4), 16) / 255;
        const b = parseInt(h.slice(4, 6), 16) / 255;
        controller.scene.clearColor = new Color4(r, g, b, 1.0);
        controller.scene.environmentTexture = null;
      }
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── set_ground ───────────────────────────────────────────────────────────────
  if (cmd === "set_ground") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (!controller) {
      viaRespond({ type: "value", value: null });
      return true;
    }
    const { MeshBuilder, StandardMaterial, Color3 } = await import("@babylonjs/core");
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: command.width ?? 10, height: command.length ?? 10, subdivisions: 2 },
      controller.scene
    );
    const mat = new StandardMaterial("ground_mat", controller.scene);
    mat.diffuseColor = hexToColor3("#888888", Color3);
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    ground.material = mat;
    viaRespond({ type: "value", value: viaRegister(ground) });
    return true;
  }

  // ── create_group ─────────────────────────────────────────────────────────────
  if (cmd === "create_group") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (!controller) {
      viaRespond({ type: "error", message: "Invalid scene handle" });
      return true;
    }
    const { TransformNode, Vector3 } = await import("@babylonjs/core");
    const node = new TransformNode("group", controller.scene);
    if (command.position) {
      node.position = new Vector3(
        command.position.x ?? 0,
        command.position.y ?? 0,
        command.position.z ?? 0
      );
    }
    if (command.rotation) {
      const toRad = Math.PI / 180;
      node.rotation = new Vector3(
        (command.rotation.x ?? 0) * toRad,
        (command.rotation.y ?? 0) * toRad,
        (command.rotation.z ?? 0) * toRad
      );
    }
    if (command.scale) {
      node.scaling = new Vector3(
        command.scale.x ?? 1,
        command.scale.y ?? 1,
        command.scale.z ?? 1
      );
    }
    viaRespond({ type: "value", value: viaRegister(node) });
    return true;
  }

  // ── create_mesh ──────────────────────────────────────────────────────────────
  if (cmd === "create_mesh") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (!controller) {
      viaRespond({ type: "error", message: "Invalid scene handle" });
      return true;
    }
    try {
      const { MeshBuilder, StandardMaterial, Color3, Vector3 } = await import("@babylonjs/core");
      const cfg = command.config;
      let mesh: any;

      if (cfg.type === "box") {
        mesh = MeshBuilder.CreateBox("box", {
          width: cfg.width ?? 1,
          height: cfg.height ?? 1,
          depth: cfg.depth ?? 1,
        }, controller.scene);
      } else if (cfg.type === "sphere") {
        mesh = MeshBuilder.CreateSphere("sphere", {
          diameter: cfg.diameter ?? 1,
          segments: cfg.segments ?? 16,
        }, controller.scene);
      } else if (cfg.type === "cylinder") {
        mesh = MeshBuilder.CreateCylinder("cylinder", {
          diameter: cfg.diameter ?? 1,
          height: cfg.height ?? 1,
          tessellation: cfg.tessellation ?? 24,
        }, controller.scene);
      } else {
        viaRespond({ type: "error", message: `Unknown mesh type: ${cfg.type}` });
        return true;
      }

      // Apply position
      if (cfg.position) {
        mesh.position = new Vector3(
          cfg.position.x ?? 0,
          cfg.position.y ?? 0,
          cfg.position.z ?? 0
        );
      }

      // Apply rotation (degrees → radians)
      if (cfg.rotation) {
        const toRad = Math.PI / 180;
        mesh.rotation = new Vector3(
          (cfg.rotation.x ?? 0) * toRad,
          (cfg.rotation.y ?? 0) * toRad,
          (cfg.rotation.z ?? 0) * toRad
        );
      }

      // Apply scale
      if (cfg.scale) {
        mesh.scaling = new Vector3(
          cfg.scale.x ?? 1,
          cfg.scale.y ?? 1,
          cfg.scale.z ?? 1
        );
      }

      // Apply material / color / texture (material constant takes priority)
      if (cfg.material) {
        mesh.material = await createMaterial(cfg.material, controller.scene);
      } else {
        const mat = new StandardMaterial("mat_" + mesh.uniqueId, controller.scene);
        if (cfg.texture) {
          const { Texture } = await import("@babylonjs/core");
          mat.diffuseTexture = new Texture(cfg.texture, controller.scene);
          mat.diffuseColor = new Color3(1, 1, 1);
        } else {
          mat.diffuseColor = hexToColor3(cfg.color ?? "#888888", Color3);
        }
        mesh.material = mat;
      }

      // Apply glossiness if pre-set before scene.add()
      if (cfg.glossiness != null && mesh.material?.roughness !== undefined) {
        mesh.material.roughness = 1 - Math.max(0, Math.min(1, cfg.glossiness));
      }

      // Apply tiling if pre-set before scene.add()
      if (cfg.tiling != null && mesh.material) {
        const u = cfg.tiling.u ?? 1;
        const v = cfg.tiling.v ?? u;
        if (!mesh.metadata) mesh.metadata = {};
        mesh.metadata.tiling = { u, v };
        applyTiling(mesh.material, u, v);
      }

      if (command.parent != null) {
        const parentNode = viaGet(command.parent);
        if (parentNode) mesh.parent = parentNode;
      }

      const meshHandle = viaRegister(mesh);
      viaRespond({ type: "value", value: meshHandle });
    } catch (err) {
      viaRespond({ type: "error", message: String(err) });
    }
    return true;
  }

  // ── set_position ─────────────────────────────────────────────────────────────
  if (cmd === "set_position") {
    const mesh = viaGet(command.mesh);
    if (mesh) {
      mesh.position.x = command.x ?? 0;
      mesh.position.y = command.y ?? 0;
      mesh.position.z = command.z ?? 0;
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── set_scale ────────────────────────────────────────────────────────────────
  if (cmd === "set_scale") {
    const mesh = viaGet(command.mesh);
    if (mesh) {
      mesh.scaling.x = command.x ?? 1;
      mesh.scaling.y = command.y ?? 1;
      mesh.scaling.z = command.z ?? 1;
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── set_color ────────────────────────────────────────────────────────────────
  if (cmd === "set_color") {
    const mesh = viaGet(command.mesh);
    if (mesh?.material) {
      const { Color3 } = await import("@babylonjs/core");
      mesh.material.diffuseColor = hexToColor3(command.color, Color3);
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── set_rotation ─────────────────────────────────────────────────────────────
  if (cmd === "set_rotation") {
    const mesh = viaGet(command.mesh);
    if (mesh) {
      const { Vector3 } = await import("@babylonjs/core");
      const toRad = Math.PI / 180;
      mesh.rotation = new Vector3(
        (command.x ?? 0) * toRad,
        (command.y ?? 0) * toRad,
        (command.z ?? 0) * toRad
      );
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── set_glossiness ───────────────────────────────────────────────────────────
  if (cmd === "set_glossiness") {
    const mesh = viaGet(command.mesh);
    if (mesh?.material?.roughness !== undefined) {
      mesh.material.roughness = 1 - Math.max(0, Math.min(1, command.value ?? 0));
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── set_tiling ───────────────────────────────────────────────────────────────
  if (cmd === "set_tiling") {
    const mesh = viaGet(command.mesh);
    if (mesh) {
      const u = command.u ?? 1;
      const v = command.v ?? u;
      if (!mesh.metadata) mesh.metadata = {};
      mesh.metadata.tiling = { u, v };
      if (mesh.material) applyTiling(mesh.material, u, v);
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── set_material ─────────────────────────────────────────────────────────────
  if (cmd === "set_material") {
    const mesh = viaGet(command.mesh);
    if (mesh) {
      const newMat = await createMaterial(command.material, mesh.getScene());
      if (newMat) {
        if (mesh.material) mesh.material.dispose();
        mesh.material = newMat;
        const t = mesh.metadata?.tiling;
        if (t) applyTiling(newMat, t.u, t.v);
      }
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── set_texture ──────────────────────────────────────────────────────────────
  if (cmd === "set_texture") {
    const mesh = viaGet(command.mesh);
    if (mesh?.material) {
      const { Texture, Color3 } = await import("@babylonjs/core");
      mesh.material.diffuseTexture = new Texture(command.texture, mesh.material.getScene());
      mesh.material.diffuseColor = new Color3(1, 1, 1);
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── register_frame ───────────────────────────────────────────────────────────
  if (cmd === "register_frame") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (controller) {
      let lastTime = performance.now();
      controller.scene.onBeforeRenderObservable.add(() => {
        // Only dispatch if Python is waiting. Drop the frame otherwise —
        // no queue buildup when the callback takes longer than one frame.
        if (!controller._pendingRespond) return;
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        const respond = controller._pendingRespond;
        controller._pendingRespond = null;
        respond({ type: "frame", dt });
      });
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── get_context ──────────────────────────────────────────────────────────────
  if (cmd === "get_context") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (!controller) {
      viaRespond({ type: "error", message: "Invalid scene handle" });
      return true;
    }
    viaRespond({ type: "value", value: controller._overlayHandle });
    return true;
  }

  // ── camera_set_position ──────────────────────────────────────────────────────
  if (cmd === "camera_set_position") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (controller) {
      const { Vector3 } = await import("@babylonjs/core");
      controller.camera.setPosition(new Vector3(command.x ?? 0, command.y ?? 0, command.z ?? 0));
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── camera_move ──────────────────────────────────────────────────────────────
  if (cmd === "camera_move") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (controller) {
      const { Vector3 } = await import("@babylonjs/core");
      const pos = controller.camera.position;
      controller.camera.setPosition(new Vector3(
        pos.x + (command.dx ?? 0),
        pos.y + (command.dy ?? 0),
        pos.z + (command.dz ?? 0)
      ));
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── camera_look_at ───────────────────────────────────────────────────────────
  if (cmd === "camera_look_at") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (controller) {
      const { Vector3 } = await import("@babylonjs/core");
      if (command.mesh != null) {
        const target = viaGet(command.mesh);
        if (target) {
          const pos = target.absolutePosition ?? target.position;
          controller.camera.target = pos.clone();
        }
      } else {
        controller.camera.target = new Vector3(command.x ?? 0, command.y ?? 0, command.z ?? 0);
      }
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── camera_set_distance ──────────────────────────────────────────────────────
  if (cmd === "camera_set_distance") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (controller) {
      controller.camera.radius = command.r ?? 12;
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── camera_follow ────────────────────────────────────────────────────────────
  if (cmd === "camera_follow") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (controller) {
      if (controller._followObserver) {
        controller.scene.onBeforeRenderObservable.remove(controller._followObserver);
        controller._followObserver = null;
      }
      if (command.mesh != null) {
        const target = viaGet(command.mesh);
        if (target) {
          if (command.distance != null) controller.camera.radius = command.distance;
          controller._followObserver = controller.scene.onBeforeRenderObservable.add(() => {
            const pos = target.absolutePosition ?? target.position;
            if (pos) controller.camera.target.copyFrom(pos);
          });
        }
      }
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── camera_reset ─────────────────────────────────────────────────────────────
  if (cmd === "camera_reset") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    if (controller) {
      if (controller._followObserver) {
        controller.scene.onBeforeRenderObservable.remove(controller._followObserver);
        controller._followObserver = null;
      }
      const { Vector3 } = await import("@babylonjs/core");
      controller.camera.alpha = -Math.PI / 2;
      controller.camera.beta = Math.PI / 4;
      controller.camera.radius = 12;
      controller.camera.target = Vector3.Zero();
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  // ── register_click ───────────────────────────────────────────────────────────
  if (cmd === "register_click") {
    const controller = viaGet(command.scene) as SceneController | undefined;
    const mesh = viaGet(command.mesh);
    if (controller && mesh) {
      const { ActionManager, ExecuteCodeAction } = await import("@babylonjs/core");
      const meshHandle = command.mesh;
      mesh.actionManager = new ActionManager(controller.scene);
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          dispatchEvent(controller, { type: "click", mesh: meshHandle });
        })
      );
    }
    viaRespond({ type: "value", value: null });
    return true;
  }

  return false;
}
