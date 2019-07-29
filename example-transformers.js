const Chance = require("chance");
const chance = new Chance();

module.exports = {
  tables: {
    user: {
      email: () => chance.email()
    }
  }
};
