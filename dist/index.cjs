"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _Spark = require("./Spark.cjs");
Object.keys(_Spark).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Spark[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Spark[key];
    }
  });
});