"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _Basic = require("./Basic.cjs");
Object.keys(_Basic).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Basic[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Basic[key];
    }
  });
});