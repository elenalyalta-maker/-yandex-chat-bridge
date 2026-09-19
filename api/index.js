import http from "node:http";

const PUBLIC_YANDEX_FOLDER =
  "https://disk.yandex.ru/d/4dC2x2G-OXrB0g";

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.searchParams.get("path") || "/";
    const action = url.searchParams.get("action") || "list";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");

    if (action === "download" || action === "url") {
      const api = new URL(
        "https://cloud-api.yandex.net/v1/disk/public/resources/download"
      );

      api.searchParams.set("public_key", PUBLIC_YANDEX_FOLDER);
      api.searchParams.set("path", path);

      const yandexResponse = await fetch(api);
      const data = await yandexResponse.json();

      if (!yandexResponse.ok || !data.href) {
        res.writeHead(yandexResponse.status || 500, {
          "Content-Type": "application/json; charset=utf-8"
        });
        return res.end(JSON.stringify(data));
      }

      if (action === "download") {
        res.writeHead(302, {
          Location: data.href
        });
        return res.end();
      }

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8"
      });

      return res.end(
        JSON.stringify({
          path,
          href: data.href
        })
      );
    }

    const api = new URL(
      "https://cloud-api.yandex.net/v1/disk/public/resources"
    );

    api.searchParams.set("public_key", PUBLIC_YANDEX_FOLDER);
    api.searchParams.set("path", path);
    api.searchParams.set("limit", "1000");

    const yandexResponse = await fetch(api);
    const body = await yandexResponse.text();

    res.writeHead(yandexResponse.status, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(body);
  } catch (error) {
    res.writeHead(500, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(
      JSON.stringify({
        error: "Bridge error",
        message: String(error)
      })
    );
  }
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Yandex bridge running on port ${PORT}`);
});
