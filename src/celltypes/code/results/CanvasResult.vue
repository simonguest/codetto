<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
  value: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let payload: any;
  try {
    payload = JSON.parse(props.value);
  } catch {
    return;
  }

  canvas.width = payload.width ?? 400;
  canvas.height = payload.height ?? 300;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const cmd of payload.commands ?? []) {
    switch (cmd.op) {
      case "clear":
        ctx.fillStyle = cmd.color ?? "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
      case "text":
        ctx.fillStyle = cmd.color ?? "#000000";
        ctx.font = `${cmd.size ?? 16}px sans-serif`;
        ctx.fillText(cmd.text, cmd.x, cmd.y);
        break;
      case "rect":
        if (cmd.fill) {
          ctx.fillStyle = cmd.color ?? "#000000";
          ctx.fillRect(cmd.x, cmd.y, cmd.w, cmd.h);
        } else {
          ctx.strokeStyle = cmd.color ?? "#000000";
          ctx.strokeRect(cmd.x, cmd.y, cmd.w, cmd.h);
        }
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(cmd.cx, cmd.cy, cmd.r, 0, Math.PI * 2);
        if (cmd.fill) {
          ctx.fillStyle = cmd.color ?? "#000000";
          ctx.fill();
        } else {
          ctx.strokeStyle = cmd.color ?? "#000000";
          ctx.stroke();
        }
        break;
      case "line":
        ctx.beginPath();
        ctx.moveTo(cmd.x1, cmd.y1);
        ctx.lineTo(cmd.x2, cmd.y2);
        ctx.strokeStyle = cmd.color ?? "#000000";
        ctx.lineWidth = cmd.width ?? 1;
        ctx.stroke();
        break;
    }
  }
}

onMounted(draw);
watch(() => props.value, draw);
</script>

<template>
  <div class="canvas-output">
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
.canvas-output {
  padding: 6px 0;
}
canvas {
  display: block;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 4px;
}
</style>
