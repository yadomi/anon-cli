const argv = require("minimist")(process.argv.slice(2));
const md5 = require("md5");
const R = require("ramda");
const { resolve, basename } = require("path");
const {
  existsSync: exists,
  createReadStream,
  createWriteStream
} = require("fs");
const Stream = require("stream");
const Readline = require("readline");

const bin = basename(process.argv[1]);
const input = argv["i"];
const output = argv["o"];
const force = argv["f"];

const anonymize = R.compose(
  R.join(""),
  R.append(".com"),
  R.insert("12", "@"),
  md5
);

function usage() {
  console.log(`usage: ${bin} -i input.sql -o output.sql [-f]`);
}

if (!input || !output) {
  usage();
  process.exit(2);
}

const inputfile = resolve(input);
const outputfile = resolve(output);

if (!exists(inputfile)) {
  console.log(`${bin}: no such file or directory: ${input}`);
  process.exit(2);
}

if (exists(outputfile) && !force) {
  console.log(`${bin}: file exist: ${output}. Use -f to force`);
  process.exit(2);
}

const EMAIL_REGEX = /([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)/;

const instream = createReadStream(inputfile);
const outstream = createWriteStream(outputfile);

const lines = Readline.createInterface(instream, outstream);

const replacer = match => {
  return anonymize(match);
};

lines.on("line", line => {
  const altered = line.replace(EMAIL_REGEX, replacer);
  outstream.write(altered + "\n");
});
