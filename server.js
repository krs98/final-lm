const http = require("http");
const fs   = require("fs");
const { exec } = require("child_process");

const dirs = ["node_modules", "out", "pages", "styles", "assets"];

const serveAs = (name, type) => (res, code = 200) => {
    res.writeHead(200, { "content-type": type });
    fs.createReadStream(name).pipe(res);
}

const fileTypes = {
    html: "text/html",
    css:  "text/css",
    js:   "text/javascript",
    png:  "image/png",
    jpg:  "image/jpg",
    webp: "image/webp",
    svg:  "image/svg+xml",
    mp4:  "video/mp4",
    map:  "text/javascript"
}
const last = arr => arr[arr.length - 1];
const ext  = file => last(file.split("."));
const fileType = file => fileTypes[ext(file)];

const isDir = path => fs.lstatSync(path).isDirectory();
const readDir = dir => 
    fs.readdirSync(dir)
        .map(item => `${dir}/${item}`)
        .flatMap(item => isDir(item) ? readDir(item) : item);

const stripIndex = str => str.replace("index.html", "");
const stripHtmlExt = str => str.replace(".html", "");
const transformHtml = str => stripHtmlExt(stripIndex(str));

const transform = file => 
    ext(file) === "html" ? transformHtml(last(file.split("/"))) : file;

const toEntry = file => ["/" + transform(file), serveAs(file, fileType(file))];
const createEntries = dirs => 
    dirs.filter(fs.existsSync)
        .flatMap(readDir)
        .map(toEntry);

const createRoutes = dirs => Object.fromEntries(createEntries(dirs));
const routes = createRoutes(dirs);

//const notFound = res => serveAs(res, 404)(

const server = http.createServer((req, res) => {
    const route = routes[req.url];
    console.log(req.url, route);
    route ? route(res) : serveAs("pages/404.html", "text/html")(res, 404);
});

server.listen(process.env.PORT || 3000, () => console.log("Listening at port 3000..."));
