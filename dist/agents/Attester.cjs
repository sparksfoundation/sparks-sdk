'use strict';

const Attester = (Base) => class Attester extends Base {
  constructor(...args) {
    super(...args);
  }
};
Attester.type = "agent";
var Attester_default = Attester;

module.exports = Attester_default;
