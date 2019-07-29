# anon-cli

CLI tool to redact/anonymize PostgreSQL dump generated via pg_dump with COPY statement

## Usage:

| -i  | Specify the input file, aka the pg_dump generated file                                     |
| --- | ------------------------------------------------------------------------------------------ |
| -o  | Specify the output file. This is the file with redacted data                               |
| -t  | Specify the transfomer file. This is the file where you describe what to redact. See below |
| -f  | Force overwrite ouptut file if already exist                                               |

### Example:

```
anon -i ./input.dump -o ./output.dump -t ./example-transformers.js
```

### Transformer file

The transformer file is a file where you describe how and what you want to redact.

It's a Javascript file with that export an object.

Each root keys of this object represent the table name where you want to alter data.

Nested keys are the column name that you want to match, the value is a function that will be called when matching. The value of the column is passed as argument of this function.

#### Example:

```js
const Chance = require("chance");
const chance = new Chance();

module.exports = {
  user: {
    email: () => chance.email()
  }
};
```

With this transformer, only values of the column `email` of the table `user` will be replace by a random value provided by the [Chance](https://chancejs.com/) package
