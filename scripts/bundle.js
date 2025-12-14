import { build } from "esbuild";

await build({
    entryPoints: ["index.js"],
    bundle: true,
    platform: "node",
    outfile: "dist/bot.js",
    format: "esm",
    loader: {
        ".json": "json" // JSON dosyaları tek dosyanın içine gömülsün
    },
    external: [], // hiçbir şeyi hariç bırakma
    minify: false
});

console.log("Bundle oluşturuldu: dist/bot.js");
