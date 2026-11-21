import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { spawn } from "node:child_process"

function sidecarDevApi(): Plugin {
  const projectRoot = path.resolve(__dirname, "..")
  return {
    name: "sidecar-dev-api",
    configureServer(server) {
      server.middlewares.use("/__sidecar", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405
          res.end(JSON.stringify({ error: "POST required" }))
          return
        }
        const chunks: Buffer[] = []
        req.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
        req.on("end", () => {
          let body: { cmd?: string; payload?: unknown } = {}
          try {
            body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")
          } catch {
            res.statusCode = 400
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ error: "Invalid JSON" }))
            return
          }
          const child = spawn(
            "python",
            ["backend/sidecar.py", body.cmd || "", JSON.stringify(body.payload ?? {})],
            { cwd: projectRoot }
          )
          let stdout = ""
          let stderr = ""
          child.stdout.on("data", (data) => { stdout += data.toString() })
          child.stderr.on("data", (data) => { stderr += data.toString() })
          child.on("close", (code) => {
            res.setHeader("Content-Type", "application/json")
            if (code !== 0) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: stderr.trim() || `sidecar exited ${code}` }))
              return
            }
            res.end(stdout.trim() || "{}")
          })
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sidecarDevApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})
