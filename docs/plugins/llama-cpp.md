---
summary: "Install the official llama.cpp provider for local GGUF memory embeddings"
read_when:
  - You want memory search embeddings from a local GGUF model
  - You are configuring memorySearch.provider = "local"
  - You need the OpenClaw plugin that owns the node-llama-cpp runtime
title: "llama.cpp Provider"
sidebarTitle: "llama.cpp Provider"
---

`llama-cpp` is the local GGUF embedding provider plugin. Its public npm and
ClawHub packages are temporarily unavailable, so this plugin is hidden from
normal install surfaces for this release.

The main `openclaw` npm package does not include `node-llama-cpp`. Keeping the
native dependency in this plugin prevents normal OpenClaw npm updates from
deleting a manually installed runtime inside the OpenClaw package directory.

For lower-friction local embeddings, set `memorySearch.provider` to `ollama`
with `model: "nomic-embed-text"`, or set it to `openai-compatible` with
LM Studio's `/v1` base URL and loaded embedding model instead.

## Configuration

Set the memory search provider to `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

The default model is `embeddinggemma-300m-qat-Q8_0.gguf`. You can also point
`local.modelPath` at a local `.gguf` file.

## Native Runtime

Use Node 24 for the smoothest native install path. Source checkouts using pnpm
may need to approve and rebuild the native dependency:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

For lower-friction local embeddings, set `memorySearch.provider` to `ollama`
with `model: "nomic-embed-text"`, or set it to `openai-compatible` with
LM Studio's `/v1` base URL and loaded embedding model instead.
