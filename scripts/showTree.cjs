const fs = require("fs");
const path = require("path");

function printTree(dir, prefix = "") {
    const items = fs.readdirSync(dir, { withFileTypes: true })
        .filter(x => x.name !== "node_modules" && !x.name.startsWith("."));

    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const branch = isLast ? "└── " : "├── ";

        console.log(prefix + branch + item.name);

        if (item.isDirectory()) {
            const nextPrefix = prefix + (isLast ? "    " : "│   ");
            printTree(path.join(dir, item.name), nextPrefix);
        }
    });
}

console.log("Project Tree:\n");
printTree("./");
