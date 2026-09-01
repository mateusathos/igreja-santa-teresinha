const { handleUpload } = require("@vercel/blob/client");
const { isAdminRequest } = require("../_lib/auth");
const { readJsonBody, sendJson, setAllowedMethods } = require("../_lib/http");

module.exports = async function handler(req, res) {
  setAllowedMethods(res, ["POST"]);
  if (req.method !== "POST") return sendJson(res, 405, { error: "Metodo nao permitido." });
  try {
    const response = await handleUpload({
      body: await readJsonBody(req),
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAdminRequest(req)) throw new Error("Sessao invalida ou expirada.");
        if (!pathname.startsWith("avisos/")) throw new Error("Caminho de upload invalido.");
        return {
          allowedContentTypes: ["image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 30
        };
      },
      onUploadCompleted: async () => {}
    });
    return sendJson(res, 200, response);
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "Erro ao enviar imagem." });
  }
};
