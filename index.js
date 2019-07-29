const argv = require("minimist")(process.argv.slice(2));
const { resolve, basename } = require("path");
const {
  existsSync: exists,
  createReadStream,
  createWriteStream
} = require("fs");
const Stream = require("stream");
const Readline = require("readline");

const bin = basename(process.argv[1]);
const transfomer = argv["t"];
const input = argv["i"];
const output = argv["o"];
const force = argv["f"];

function usage() {
  console.log(
    `usage: ${bin} -t ./transfomers.js -i input.sql -o output.sql [-f]`
  );
}

if (!input || !output || !transfomer) {
  usage();
  process.exit(2);
}

const inputfile = resolve(input);
const outputfile = resolve(output);
const transfomerfile = resolve(transfomer);

if (!exists(transfomerfile)) {
  console.log(`${bin}: no such file or directory: ${transfomer}`);
  process.exit(2);
}

if (!exists(inputfile)) {
  console.log(`${bin}: no such file or directory: ${input}`);
  process.exit(2);
}

if (exists(outputfile) && !force) {
  console.log(`${bin}: file exist: ${output}. Use -f to force`);
  process.exit(2);
}

const transfomers = require(transfomerfile);
const instream = createReadStream(inputfile);
const outstream = createWriteStream(outputfile);

const lines = Readline.createInterface(instream, outstream);

const RE = {
  TABLE: /COPY\spublic\."?([a-z_]*)"?\s\(/,
  COLUMNS: /COPY public.*\((.*)\)/
};

let currentTable = null;
let currentColumns = [];

lines.on("line", line => {
  /**
   * Reset the currentTable at the end of the insert/copy statement
   */
  if (line === "\\.") {
    currentColumns = [];
    currentTable = null;
  }

  /**
   * Replace/Redact data in specfied column from transfomers
   */
  if (currentTable) {
    const transforms = transfomers[currentTable];
    const data = line.split("\t");
    for (const column of currentColumns) {
      if (column in transforms) {
        const from = data[currentColumns.indexOf(column)];
        const to = transforms[column](from);
        if (!from || from === `\\N`) continue;
        line = line.replace(from, to);
      }
    }
  }

  /**
   * Match data insertion start
   */
  if (/COPY public/.test(line)) {
    const tableName = line.match(RE.TABLE)[1];

    if (tableName in transfomers) {
      currentTable = tableName;

      const raw = line.match(RE.COLUMNS)[1];
      const columns = raw.replace(/['"]+/g, "").split(", ");
      currentColumns = columns;
    }
  }

  outstream.write(line + "\n");
});
