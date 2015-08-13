import Levenshtein from '../../lib/levenshtein';

describe('Levenshtein', function() {
    describe('General', function () {
        it('enlarges the matrix as needed', function () {
            var l = new Levenshtein();
            var i, len;

            l.m.should.deep.equal([]);

            l.process('hi', 'there');
            len = l.m.length;
            len.should.equal(3);
            for (i = 0; i < len; ++i) {
                l.m[i].length.should.equal(6);
            }

            l.process('hello', 'there!!!');
            len = l.m.length;
            len.should.equal(6);
            for (i = 0; i < len; ++i) {
                l.m[i].length.should.equal(9);
            }

            l.process('x', 'y');
            len = l.m.length;
            len.should.equal(6);
            for (i = 0; i < len; ++i) {
                l.m[i].length.should.equal(9);
            }
        });

        describe('user-supplied cost function', function () {
            it('respects match function', function () {
                var l = new Levenshtein({
                });

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 10;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return 100;
                });
                l.set('deleteCost', function(c) {
                    return 1000;
                });

                l.process('hello', 'allo');
                l.totalCost().should.equal(1010);

                l.process('hello', 'hallo');
                l.totalCost().should.equal(10);

                l.process('hello', 'hella');
                l.totalCost().should.equal(10);
            });

            it('respects insert function', function () {
                var l = new Levenshtein({
                });

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 10;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return 100;
                });
                l.set('deleteCost', function(c) {
                    return 1000;
                });

                l.process('hallo', 'Shallow');
                l.totalCost().should.equal(200);

                l.process('hello', 'heallo');
                l.totalCost().should.equal(100);
            });

            it('respects insert function when all arguments are used', function () {
                var insertions;
                var l = new Levenshtein({
                    // type: 'substring',
                    caseSensitive: false,
                });

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }

                    // don't substitute a space char; keeps search words separate
                    if (c1 === ' ') {
                        return Infinity;
                    }

                    return 1;
                });

                l.set('insertCost', function(c, cBefore, cAfter) {
                    if (cBefore === null || cAfter === null || cBefore === ' ' || cAfter === ' ') {
                        return 0;
                    }
                    // prefer insertions inside of a word to a substitution
                    return 0.9;
                });

                l.set('deleteCost', Infinity);

                l.process('h is nl a tst', 'this is only a test');
                l.totalCost().should.equal(0.9);

                insertions = 0;
                l.recursePath(function(node) {
                    if (node.op === 'I') {
                        insertions++;
                        if (node.letter === 'e') {
                            node.i.should.equal(11);
                        }
                    }
                });
                insertions.should.equal(6);

                // test that substitution happens
                l.set('insertCost', function(c, cBefore, cAfter) {
                    if (cBefore === null || cAfter === null || cBefore === ' ' || cAfter === ' ') {
                        return 0;
                    }
                    // prefer a substitution to an insertion inside a word
                    return 1.1;
                });

                l.process('h is nl a ts', 'this is only in test');
                l.totalCost().should.equal(2);

                insertions = 0;
                l.recursePath(function(node) {
                    if (node.op === 'I') {
                        insertions++;
                    }
                    if (node.op === 'S') {
                        ['a', 't'].indexOf(node.from).should.not.equal(-1);
                        ['n', 'e'].indexOf(node.to).should.not.equal(-1);
                        [ 8,   10].indexOf(node.i).should.not.equal(-1);
                    }
                });
                insertions.should.equal(8);
            });

            it('respects delete function', function () {
                var l = new Levenshtein({
                });

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 100;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return 1000;
                });
                l.set('deleteCost', function(c) {
                    return 10;
                });

                l.process('hellos', 'allo');
                l.totalCost().should.equal(120);

                l.process('hellos', 'halo');
                l.totalCost().should.equal(120);

                l = new Levenshtein();

                // depending on the substitution value,
                // result is either:
                //
                // 3 inserts, 1 delete
                // 2 inserts, 1 substitution
                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 150;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return 100;
                });
                l.set('deleteCost', function(c) {
                    return 10;
                });

                l.process('hello', 'shallow');
                l.totalCost().should.equal(310);
            });

            it('respects match costs for different characters', function () {
                var l = new Levenshtein();

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return {
                        a: 1,
                        b: 10,
                        c: 100,
                        d: 1000,
                    }[c1];
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return Infinity;
                });
                l.set('deleteCost', function(c) {
                    return Infinity;
                });

                l.process('abcd', 'hiya');
                l.totalCost().should.equal(1111);

                l = new Levenshtein();

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return {
                        h: 1,
                        i: 10,
                        y: 100,
                        a: 1000,
                    }[c2];
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return Infinity;
                });
                l.set('deleteCost', function(c) {
                    return Infinity;
                });

                l.process('abcd', 'hiya');
                l.totalCost().should.equal(1111);
            });

            it('respects insert costs for different characters', function () {
                var l = new Levenshtein();

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 1000;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return {
                        s: 1,
                        w: 4,
                    }[c] || 100;
                });
                l.set('deleteCost', function(c) {
                    return Infinity;
                });

                l.process('hello', 'shallow!');
                l.totalCost().should.equal(1105);
            });

            it('respects delete costs for different characters', function () {
                var l = new Levenshtein();

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 10;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return 100;
                });
                l.set('deleteCost', function(c) {
                    return {
                        s: 1,
                        w: 4,
                    }[c] || 1000;
                });

                l.process('shallow!', 'hello');
                l.totalCost().should.equal(1015);
            });

            it('works when the cost functions are set multiple times', function () {
                var l = new Levenshtein();

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 10;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c) {
                    return 100;
                });
                l.set('deleteCost', function(c) {
                    return {
                        s: 1,
                        w: 4,
                    }[c] || 1000;
                });

                l.process('shallow!', 'hello');
                l.totalCost().should.equal(1015);

                // change costs
                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return Infinity;
                });
                l.set('insertCost', function(c) {
                    return 100;
                });
                l.set('deleteCost', function(c) {
                    return {
                        s: 5,
                        w: 15,
                    }[c] || 1000;
                });

                l.process('shallow!', 'hello');
                l.totalCost().should.equal(2120);

                // change costs again
                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 76;
                });
                l.set('insertCost', function(c) {
                    return 50;
                });
                l.set('deleteCost', function(c) {
                    return 50;
                });

                l.process('hallos', 'hello!?');
                l.totalCost().should.equal(202);

                // once more
                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 76;
                });
                l.set('insertCost', function(c) {
                    return 50;
                });
                l.set('deleteCost', function(c) {
                    return 10;
                });

                l.process('hallos', 'hello!?');
                l.totalCost().should.equal(170);
            });

            it('accepts numbers for insert/delete cost functions', function () {
                var l = new Levenshtein();
                l.set('matchCost', function (c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return Infinity;
                });
                l.set('insertCost', 100);
                l.set('deleteCost', 1000);
                l.process('hi', 'shy');
                l.totalCost().should.equal(1200);
            });
        });

        describe('user-supplied recursive function', function () {
            it('counts how many of each type of action is taken for each character', function () {
                var l = new Levenshtein();
                var matches = 0;
                var substitutions = 0;
                var inserts = 0;
                var deletes = 0;

                function countActions(node) {
                    switch (node.op) {
                        case 'M': matches++; break;
                        case 'S': substitutions++; break;
                        case 'I': inserts++; break;
                        case 'D': deletes++; break;
                        default: break;
                    }
                }

                l.process('wheel', 'hello');
                l.recursePath(countActions);

                matches.should.equal(3);
                substitutions.should.equal(1);
                inserts.should.equal(1);
                deletes.should.equal(1);
            });
        });
    });

    describe('Type "Whole"', function() {
        describe('construction', function() {
            it('defaults to Whole Type', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                });

                l.type.should.equal('whole');
            });

            it('explicitly sets Whole Type', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                    type: 'whole',
                });

                l.type.should.equal('whole');
                l.process('shello', 'SHmello');
                l.totalCost().should.equal(3);
            });

            it('sets first matrix row properly', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                });

                var MATRIX_LEN = l.MAX_LEN+1;
                var m = l.m;
                var i;

                for (i = 0; i < MATRIX_LEN; ++i) {
                    m[0][i].cost.should.equal(i);
                    if (i > 0) {
                        m[0][i].parent.should.equal(1);
                    } else {
                        m[0][i].parent.should.equal(-1);
                    }
                }
            });
        });

        describe('gets correct edit distance', function() {
            it('when case sensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                });

                l.process('shello', 'SHmello');
                l.totalCost().should.equal(3);
            });

            it('when case insensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('shello', 'SHmello');
                l.totalCost().should.equal(1);
            });

            it('when first string is empty', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('', 'SHmello');
                l.totalCost().should.equal(7);
            });

            it('when second string is empty', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('shello', '');
                l.totalCost().should.equal(6);
            });
        });

        describe('gets correct edit path', function() {
            it('when case sensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                });

                l.process('Strode', 'sIdes');
                l.reconstructPath().should.deep.equal([
                    {
                        i: 0,
                        letter: 'S', op: 'D',
                    },
                    {
                        i: 1,
                        letter: 't', op: 'D',
                    },
                    {
                        i: 2, j: 0,
                        op: 'S',
                        from: 'r', to: 's',
                    },
                    {
                        i: 3, j: 1,
                        op: 'S',
                        from: 'o', to: 'I',
                    },
                    {
                        i: 4, j: 2,
                        letter: 'd', op: 'M',
                    },
                    {
                        i: 5, j: 3,
                        letter: 'e', op: 'M',
                    },
                    {
                        i: 6, j: 4,
                        letter: 's', op: 'I',
                    },
                ]);
            });

            it('when case insensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('Strode', 'sIDEs');
                l.reconstructPath().should.deep.equal([
                    {
                        i: 0, j: 0,
                        letter: 's', op: 'M',
                    },
                    {
                        i: 1,
                        letter: 't', op: 'D',
                    },
                    {
                        i: 2,
                        letter: 'r', op: 'D',
                    },
                    {
                        i: 3, j: 1,
                        op: 'S',
                        from: 'o', to: 'i',
                    },
                    {
                        i: 4, j: 2,
                        letter: 'd', op: 'M',
                    },
                    {
                        i: 5, j: 3,
                        letter: 'e', op: 'M',
                    },
                    {
                        i: 6, j: 4,
                        letter: 's', op: 'I',
                    },
                ]);

            });

            it('when first string is empty', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('', 'sIDEs');
                l.reconstructPath().should.deep.equal([
                    {
                        i: 0, j: 0,
                        letter: 's', op: 'I',
                    },
                    {
                        i: 0, j: 1,
                        letter: 'i', op: 'I',
                    },
                    {
                        i: 0, j: 2,
                        letter: 'd', op: 'I',
                    },
                    {
                        i: 0, j: 3,
                        letter: 'e', op: 'I',
                    },
                    {
                        i: 0, j: 4,
                        letter: 's', op: 'I',
                    },
                ]);

            });

            it('when second string is empty', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('Strode', '');
                l.reconstructPath().should.deep.equal([
                    {
                        i: 0,
                        letter: 's', op: 'D',
                    },
                    {
                        i: 1,
                        letter: 't', op: 'D',
                    },
                    {
                        i: 2,
                        letter: 'r', op: 'D',
                    },
                    {
                        i: 3,
                        letter: 'o', op: 'D',
                    },
                    {
                        i: 4,
                        letter: 'd', op: 'D',
                    },
                    {
                        i: 5,
                        letter: 'e', op: 'D',
                    },
                ]);
            });
        });
    });

    describe('Type "Substring"', function() {
        describe('construction', function() {
            it('explicitly sets Substring Type', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                    type: 'substring',
                });

                l.type.should.equal('substring');
            });

            it('sets first matrix row properly', function() {
                function testMatrixRow() {
                    var m = l.m;
                    var MATRIX_LEN = m.length;
                    var i;

                    for (i = 0; i < MATRIX_LEN; ++i) {
                        m[0][i].cost.should.equal(0);
                        m[0][i].parent.should.equal(-1);
                    }
                }

                var l = new Levenshtein({
                    caseSensitive: true,
                    type: 'substring',
                });

                testMatrixRow();
                l.process('test', 'string');
                l.set('insertCost', 10);
                testMatrixRow();
                l.process('test2', 'string2');
                l.set('insertCost', 20);
                testMatrixRow();

                // switch types to test if switching back resets row
                l.set('type', 'whole');
                l.process('test3', 'string3');

                l.set('type', 'substring');
                testMatrixRow();
                l.process('test4', 'string4');
                testMatrixRow();
            });
        });

        describe('gets correct edit distance', function() {
            it('when case sensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                    type: 'substring',
                });

                l.process('shello', 'hSellHo');
                l.totalCost().should.equal(3);

                l.process('shello', 'ShellHo');
                l.totalCost().should.equal(2);

                l.process('hello', 'ShellHo');
                l.totalCost().should.equal(1);

                l.process('hello', 'ShelloH');
                l.totalCost().should.equal(0);

                l.process('Boufalo', 'the Buffalo run');
                l.totalCost().should.equal(2);
                l.process('Bouffaloo', 'the Buffalo run');
                l.totalCost().should.equal(2);
                l.process('Bouffalo', 'the Buffalo run');
                l.totalCost().should.equal(1);
                l.process('Bufalo', 'the Buffalo run');
                l.totalCost().should.equal(1);
                l.process('Buffalo', 'the Buffalo run');
                l.totalCost().should.equal(0);

                l.process('hello', 'WhSEeQlLlHoA');
                // results
                //   [ { i: 0, j: 3, op: 'S', from: 'h', to: 'E' },
                //     { i: 1, j: 4, op: 'M', letter: 'e' },
                //     { i: 2, j: 5, op: 'S', from: 'l', to: 'Q' },
                //     { i: 3, j: 6, op: 'M', letter: 'l' },
                //     { i: 4, op: 'D', letter: 'o' } ]
                l.totalCost().should.equal(3);

                l.set('insertCost', 0);
                l.process('hello', 'WhSEeQlLlHoA');
                l.totalCost().should.equal(0);
            });

            it('when case insensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                    type: 'substring',
                });

                l.set('insertCost', 0);
                l.process('Szls', 'you snooze you lose');
                l.totalCost().should.equal(0);

                l.set('matchCost', 100);
                l.set('insertCost', 1);
                l.set('deleteCost', 100);
                l.process('Szls', 'you snooze you lose');
                l.totalCost().should.equal(10);

                l.set('matchCost', 1);
                l.set('insertCost', 2);
                l.set('deleteCost', 100);
                l.process('Szls', 'you snooze you lose');
                l.totalCost().should.equal(3);

                l.set('matchCost', 10);
                l.set('insertCost', 4);
                l.set('deleteCost', 1);
                l.process('Szls', 'you snooze you lose');
                l.totalCost().should.equal(3);
            });
        });

        describe('gets correct edit path', function() {
            it('when case sensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                    type: 'substring',
                });

                l.process('SeNsItIvE', 'it is all case sensitive man');
                l.reconstructPath().should.deep.equal([
                    {
                        i: 0, j: 15,
                        op: 'S',
                        from: 'S', to: 's',
                    },
                    {
                        i: 1, j: 16,
                        letter: 'e', op: 'M',
                    },
                    {
                        i: 2, j: 17,
                        op: 'S',
                        from: 'N', to: 'n',
                    },
                    {
                        i: 3, j: 18,
                        letter: 's', op: 'M',
                    },
                    {
                        i: 4, j: 19,
                        op: 'S',
                        from: 'I', to: 'i',
                    },
                    {
                        i: 5, j: 20,
                        letter: 't', op: 'M',
                    },
                    {
                        i: 6, j: 21,
                        op: 'S',
                        from: 'I', to: 'i',
                    },
                    {
                        i: 7, j: 22,
                        letter: 'v', op: 'M',
                    },
                    {
                        i: 8,
                        letter: 'E', op: 'D',
                    },
                ]);
            });

            it('when case insensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                    type: 'substring',
                });

                l.process('Saide', 'the sIDEs of a cube');
                l.reconstructPath().should.deep.equal([
                    {
                        i: 0, j: 4,
                        letter: 's', op: 'M',
                    },
                    {
                        i: 1,
                        letter: 'a', op: 'D',
                    },
                    {
                        i: 2, j: 5,
                        letter: 'i', op: 'M',
                    },
                    {
                        i: 3, j: 6,
                        letter: 'd', op: 'M',
                    },
                    {
                        i: 4, j: 7,
                        letter: 'e', op: 'M',
                    },
                ]);
            });
        });
    });
});
