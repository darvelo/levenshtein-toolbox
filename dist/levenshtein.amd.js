define('levenshtein', ['exports', 'module'], function (exports, module) {
    'use strict';

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    var MATCH = 0;
    var INSERT = 1;
    var DELETE = 2;

    var Levenshtein = (function () {
        function Levenshtein(options) {
            _classCallCheck(this, Levenshtein);

            options = typeof options === 'object' ? options : {};

            if (!(this instanceof Levenshtein)) {
                return new Levenshtein(options);
            }

            this.caseSensitive = !!options.caseSensitive;
            this.m = [];
            this.set('type', options.type);
        }

        _createClass(Levenshtein, [{
            key: '_initFirstRowWhole',
            value: function _initFirstRowWhole() {
                var m = this.m;
                var len = m[0].length;
                var s1 = this._s1;
                var s2 = this._s2;
                var cBefore = null;
                var cAfter = s1[1];
                var j;

                for (j = 0; j < len; ++j) {
                    if (j > 0) {
                        m[0][j].cost = m[0][j - 1].cost + this.insertCost(s2[j], cBefore, cAfter);
                        m[0][j].parent = INSERT;
                    } else {
                        m[0][j].cost = 0;
                        m[0][j].parent = -1;
                    }
                }
            }
        }, {
            key: '_initFirstRowSubstring',
            value: function _initFirstRowSubstring() {
                var m = this.m;
                var len = m[0].length;
                var j;

                for (j = 0; j < len; ++j) {
                    m[0][j].cost = 0;
                    m[0][j].parent = -1;
                }
            }
        }, {
            key: '_initFirstRow',
            value: function _initFirstRow() {
                if (!this.m.length) {
                    return;
                }

                if (this.type === 'whole') {
                    this._initFirstRowWhole();
                } else if (this.type === 'substring') {
                    this._initFirstRowSubstring();
                }
            }
        }, {
            key: '_initFirstColumn',
            value: function _initFirstColumn() {
                var m = this.m;
                var len = m.length;
                var s1 = this._s1;
                var i;

                for (i = 0; i < len; ++i) {
                    if (i > 0) {
                        m[i][0].cost = m[i - 1][0].cost + this.deleteCost(s1[i]);
                        m[i][0].parent = DELETE;
                    } else {
                        m[i][0].cost = 0;
                        m[i][0].parent = -1;
                    }
                }
            }
        }, {
            key: '_embiggenMatrixSize',
            value: function _embiggenMatrixSize() {
                var m = this.m;
                var len1 = this._s1.length;
                var len2 = this._s2.length;
                var i, j;

                if (m.length < len1) {
                    m.length = len1;
                }

                for (i = 0; i < len1; ++i) {
                    if (!Array.isArray(m[i])) {
                        m[i] = [];
                        j = 0;
                    } else {
                        j = m[i].length;
                    }

                    if (m[i].length < len2) {
                        m[i].length = len2;
                    }

                    for (; j < len2; ++j) {
                        m[i][j] = {};
                    }
                }

                this._initFirstRow();
                this._initFirstColumn();
            }
        }, {
            key: '_prepString',
            value: function _prepString(str) {
                str = ' ' + str.slice(0, this.MAX_LEN);

                if (!this.caseSensitive) {
                    str = str.toLowerCase();
                }

                return str;
            }
        }, {
            key: '_matchType',
            value: function _matchType(c1, c2) {
                if (c1 === c2) {
                    return 'M';
                } else {
                    return 'S';
                }
            }
        }, {
            key: '_goalCellWhole',
            value: function _goalCellWhole(s1, s2) {
                return {
                    i: s1.length - 1,
                    j: s2.length - 1
                };
            }
        }, {
            key: '_goalCellSubstring',
            value: function _goalCellSubstring(s1, s2) {
                var ret = {};
                var len2 = s2.length;
                var m = this.m;
                var i = s1.length - 1;
                var j = 0;
                var k;

                ret.i = i;

                for (k = 1; k < len2; ++k) {
                    if (m[i][k].cost < m[i][j].cost) {
                        j = k;
                    }
                }

                ret.j = j;

                return ret;
            }
        }, {
            key: '_goalCell',
            value: function _goalCell() {
                var s1 = this._s1;
                var s2 = this._s2;

                if (this.type === 'whole') {
                    return this._goalCellWhole(s1, s2);
                } else if (this.type === 'substring') {
                    return this._goalCellSubstring(s1, s2);
                }
            }
        }, {
            key: '_levenshtein',
            value: function _levenshtein() {
                var opt = [];
                var s1 = this._s1;
                var s2 = this._s2;
                var m = this.m;
                var len1 = s1.length;
                var len2 = s2.length;
                var i, j, k;
                var cBefore, cAfter;

                for (i = 1; i < len1; ++i) {
                    for (j = 1; j < len2; ++j) {
                        cBefore = s1[i];
                        if (i === len1 - 1) {
                            cAfter = null;
                        } else {
                            cAfter = s1[i + 1];
                        }

                        opt[MATCH] = m[i - 1][j - 1].cost + this.matchCost(s1[i], s2[j]);
                        opt[INSERT] = m[i][j - 1].cost + this.insertCost(s2[j], cBefore, cAfter);
                        opt[DELETE] = m[i - 1][j].cost + this.deleteCost(s1[i]);

                        m[i][j].cost = opt[MATCH];
                        m[i][j].parent = MATCH;

                        for (k = INSERT; k <= DELETE; ++k) {
                            if (opt[k] < m[i][j].cost) {
                                m[i][j].cost = opt[k];
                                m[i][j].parent = k;
                            }
                        }
                    }
                }
            }
        }, {
            key: 'set',
            value: function set(name, val) {
                var oldType = this.type;
                var validTypes;

                this[name] = val;

                if (name === 'type') {
                    validTypes = ['whole', 'substring'];

                    if (validTypes.indexOf(val) === -1) {
                        this.type = 'whole';
                    }
                    if (oldType !== this.type && this.type === 'substring') {
                        this._initFirstRow();
                    }
                } else if (name === 'matchCost') {
                    if (typeof val === 'number') {
                        this[name] = function (c1, c2) {
                            if (c1 === c2) return 0;
                            return val;
                        };
                    }
                } else if (name === 'insertCost') {
                    if (typeof val === 'number') {
                        this[name] = function () {
                            return val;
                        };
                    }
                    // reinitialize first row of matrix with user values
                    if (this.type !== 'substring') {
                        this._initFirstRow();
                    }
                } else if (name === 'deleteCost') {
                    if (typeof val === 'number') {
                        this[name] = function () {
                            return val;
                        };
                    }
                    // reinitialize first column of matrix with user values
                    this._initFirstColumn();
                }
            }
        }, {
            key: 'recursePath',
            value: function recursePath(func) {
                if (typeof func !== 'function') {
                    return;
                }

                var self = this;
                var m = this.m;
                var s1 = this._s1;
                var s2 = this._s2;
                var goalCell = this._goalCell();

                function recurse(i, j) {
                    if (m[i][j].parent === -1) {
                        return;
                    }

                    var node = {};
                    var matchtype;

                    if (m[i][j].parent === MATCH) {
                        recurse(i - 1, j - 1);

                        matchtype = self._matchType(s1[i], s2[j]);
                        node.i = i - 1;
                        node.j = j - 1;
                        node.op = matchtype;

                        if (matchtype === 'M') {
                            node.letter = s2[j];
                        } else {
                            node.from = s1[i];
                            node.to = s2[j];
                        }

                        func(node);
                        return;
                    }
                    if (m[i][j].parent === INSERT) {
                        recurse(i, j - 1);

                        node.i = i;
                        node.j = j - 1;
                        node.op = 'I';
                        node.letter = s2[j];

                        func(node);
                        return;
                    }
                    if (m[i][j].parent === DELETE) {
                        recurse(i - 1, j);

                        node.i = i - 1;
                        node.op = 'D';
                        node.letter = s1[i];

                        func(node);
                        return;
                    }
                }

                recurse(goalCell.i, goalCell.j);
            }
        }, {
            key: 'reconstructPath',
            value: function reconstructPath() {
                var path = [];
                this.recursePath(function (node) {
                    return path.push(node);
                });
                return path;
            }
        }, {
            key: 'totalCost',
            value: function totalCost() {
                var _this = this;

                var goalCell;

                if (this.s1.length === 0) {
                    return this.s2.split('').reduce(function (p, c) {
                        return p + _this.insertCost(c, null, null);
                    }, 0);
                } else if (this.s2.length === 0) {
                    return this.s1.split('').reduce(function (p, c) {
                        return p + _this.deleteCost(c);
                    }, 0);
                } else {
                    goalCell = this._goalCell();
                    return this.m[goalCell.i][goalCell.j].cost;
                }
            }

            // override with .set('matchCost', fn) to provide a different cost for mis/matching
            // receives characters to be compared
        }, {
            key: 'matchCost',
            value: function matchCost(c1, c2) {
                if (c1 === c2) {
                    return 0;
                }

                return 1;
            }

            /**
            * User-overridable function that returns the cost of any particular insertion. Override with `.set('insertCost', fn)` before searching to provide a different cost function.
            * @param {String} c The character to be inserted from the text into the search pattern that would help transform the pattern into the text.
            * @param {(String|null)} cBefore The character in the search pattern immediately to the left of the cursor position of the insertion. `null` if the cursor position is at the beginning of the search pattern.
            * @param {(String|null)} cAfter The character in the search pattern immediately to the right of the cursor position of the insertion. `null` if the cursor position is at the end of the search pattern.
            * @return {Number} The cost of insertion.
            */
        }, {
            key: 'insertCost',
            value: function insertCost(c, cBefore, cAfter) {
                return 1;
            }

            // override with .set('deleteCost', fn) to provide a different cost for deletion
            // receives character to be deleted
        }, {
            key: 'deleteCost',
            value: function deleteCost(c) {
                return 1;
            }
        }, {
            key: 'process',
            value: function process(s1, s2) {
                // store strings with a space prepended to work with the matrix
                this._s1 = this._prepString(s1);
                this._s2 = this._prepString(s2);
                // store strings as they were given
                this.s1 = this._s1.slice(1);
                this.s2 = this._s2.slice(1);

                // ensure the matrix is large enough and has
                // the right cost values in the first row/column
                this._embiggenMatrixSize();

                // perform string approximation
                this._levenshtein();

                return this;
            }
        }]);

        return Levenshtein;
    })();

    module.exports = Levenshtein;

    // vim: shiftwidth=4
});