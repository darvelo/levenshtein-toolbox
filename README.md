# Intro

Calculate Levenshtein distance and much more!

# Install

**Using bower:**

```bash
$ bower install levenshtein-toolbox --save
```

Use your favorite flavor in the `dist/` directory. Under AMD it registers the module name: `levenshtein-toolbox`. As a global, use: `LevenshteinToolbox`.

**Using npm:**

```bash
$ npm install levenshtein-toolbox --save
```

Use `var x = require('levenshtein-toolbox')` in your code.

# Usage

> Note: I'll be using `chai`'s  `.should` test construction in the examples to show what results you can expect. The library itself sets no `.should` property.

Not only can you calculate the edit distance between any two strings with this library, you can also:

## View and act on detailed information in each step

You can view each step taken in the process of converting your pattern string (first argument to `.process()`) against a substring of the given text (second argument). Use this information to make your own assessments like the maximum insertions/deletions/substitutions you'll allow, or how closely you want the pattern string to match the text in order to perform some action.

Examples:

```js
var l = new LevenshteinToolbox();
var matches = 0;
var substitutions = 0;
var inserts = 0;
var deletes = 0;
var patternString = 'wheel';
var len = patternString.length;
var text = 'hello';

function countActions(node) {
    switch (node.op) {
        // match operation was done
        case 'M': matches++; break;
        // subtitution operation was done
        case 'S': substitutions++; break;
        // insert operation was done
        case 'I': inserts++; break;
        // delete operation was done
        case 'D': deletes++; break;
        default: break;
    }
}

// perform the Levenshtein distance algorithm,
// converting `patternString` to `text`.
l.process(patternString, text);
// view each step in the path of converting `patternString` to `text`
l.recursePath(countActions);

matches.should.equal(3);
substitutions.should.equal(1);
inserts.should.equal(1);
deletes.should.equal(1);

if (matches/len > 0.8) {
    console.log('pattern string was mostly matched in the text');
}
```

```js
var l = new LevenshteinToolbox({
    // case insensitivity is the default,
    // but you can still be more explicit
    caseSensitive: false,
});

l.process('hello', 'hola!!');

// reconstruct and return the path taken in
// converting the pattern string to the text
l.reconstructPath().should.deep.equal([
    { i: 0, j: 0, op: 'M', letter: 'h' },
    { i: 1, j: 1, op: 'S', from: 'e', to: 'o' },
    { i: 2, j: 2, op: 'M', letter: 'l' },
    { i: 3, j: 3, op: 'I', letter: 'a' },
    { i: 3, j: 4, op: 'S', from: 'l', to: '!' },
    { i: 4, j: 5, op: 'S', from: 'o', to: '!' }
]);
```

```js
var l = new LevenshteinToolbox({
    caseSensitive: true,
});

l.process('hello', 'HOLA!!');
l.reconstructPath().should.deep.equal([
    { i: 0, j: 0, op: 'I', letter: 'H' },
    { i: 0, j: 1, op: 'S', from: 'h', to: 'O' },
    { i: 1, j: 2, op: 'S', from: 'e', to: 'L' },
    { i: 2, j: 3, op: 'S', from: 'l', to: 'A' },
    { i: 3, j: 4, op: 'S', from: 'l', to: '!' },
    { i: 4, j: 5, op: 'S', from: 'o', to: '!' }
]);
```

## Choose edit distance type

Typically edit distance is done against both whole strings, but by putting `type: substring` into the options object passed into the constructor function, you can match your pattern string (first argument to `.process()`) against a substring of the given text (second argument). This means the least-cost match will be found anywhere in the text, and insertions up to that point cost nothing. 

By default, `type: whole` is set, where the edit distance is calculated starting at the beginning of the text (all insertions will cost). You can change the type at any time with `.set('type', 'whole')` or `.set('type', 'substring')`.

By default, matches have a cost of `0` and insertions, deletions, and subtitutions all have a default cost of `1`.

Examples:

```js
var l = new LevenshteinToolbox();
var patternString = 'science';
var text = 'do it for science!!';

l.process(patternString, text);
// insert eveything up to 'science',
// then insert the exclamation points
l.totalCost().should.equal(12);
```

```js
var l = new LevenshteinToolbox({
    type: 'substring',
});
var patternString = 'science';
var text = 'do it for science!!';

l.process(patternString, text);
// match the least-cost *substring* of `text`
// insert everything up to 'science' at no cost,
// then match `science` and stop there.
// if `patternString` were `scence`, for example,
// one insertion would take place, for a total cost of 1.
l.totalCost().should.equal(0);
```

## Directly influence which path is taken

Introduce your own cost functions for the three string operations: matching/substitution, char insertion, and char deletion, and you'll have total control over how the algorithm finds the cheapest path.

Make sure you use `.set()` to set your cost functions, so that the library can do some internal setup.

Examples:

```js
// the `matchCost` function dictates the cost when both
// letters in both strings match, and if they don't match,
// the cost of doing a substitution from the first to the second.
// you can even vary the cost depending on the letters being compared.
function matchCost(c1, c2) {
    if (c1 === c2) {
        return 0;
    }

    // don't substitute a space char; keeps words separate
    if (c1 === ' ' || c2 === ' ') {
        return Infinity;
    }

    return 1;
}

// the `insertCost` is the cost of insertion of a letter in the text
// into the pattern string to make them match at that point. `cBefore`
// and `cAfter` are the chars in the pattern string before and after
// the insertion point, respectively, or `null` if at the beginning
// or end of the pattern string.
function insertCost(c, cBefore, cAfter) {
    // insertion at a word boundary is free
    if (cBefore === null || cAfter === null || cBefore === ' ' || cAfter === ' ') {
        return 0;
    }
    // prefer insertions inside of a word to a substitution
    return 0.9;
}

// you can set the cost as a function or a numeric value.
// the `deleteCost` is the cost of deleting a char from
// `patternString` in order to better match the text.
//
// specifying a large value will make the algorithm prefer
// a path that doesn't include deletions
var deleteCost = Infinity;

var l = new LevenshteinToolbox({
    type: 'substring',
});

l.set('matchCost', matchCost);
l.set('insertCost', insertCost);
l.set('deleteCost', deleteCost);

l.process('prefer insertios', 'prefer insertions inside of a word to a substitution');
l.totalCost().should.equal(0.9);
l.reconstructPath().should.deep.equal([
    { i: 0,  j: 0,  op: 'M', letter: 'p' },
    { i: 1,  j: 1,  op: 'M', letter: 'r' },
    { i: 2,  j: 2,  op: 'M', letter: 'e' },
    { i: 3,  j: 3,  op: 'M', letter: 'f' },
    { i: 4,  j: 4,  op: 'M', letter: 'e' },
    { i: 5,  j: 5,  op: 'M', letter: 'r' },
    { i: 6,  j: 6,  op: 'M', letter: ' ' },
    { i: 7,  j: 7,  op: 'M', letter: 'i' },
    { i: 8,  j: 8,  op: 'M', letter: 'n' },
    { i: 9,  j: 9,  op: 'M', letter: 's' },
    { i: 10, j: 10, op: 'M', letter: 'e' },
    { i: 11, j: 11, op: 'M', letter: 'r' },
    { i: 12, j: 12, op: 'M', letter: 't' },
    { i: 13, j: 13, op: 'M', letter: 'i' },
    { i: 14, j: 14, op: 'M', letter: 'o' },
//
// if the insertionCost were >=1 instead of 0.9,
// the last bit would look like this:
//  { i: 15, j: 15, op: 'S', from: 's', to: 'n' }
// and the cost would be 1.
//
// since the insertionCost is 0.9, though, the algorithm
// performs the cheaper insertion and matches the letter `s` instead.
//
    { i: 15, j: 15, op: 'I', letter: 'n' },
    { i: 15, j: 16, op: 'M', letter: 's' }
]);

// notice here how the insertions at the ends of a word have no cost.
// the only costs here are the insertions inside the "word" `insrto`.
l.process('prefer insrto f', 'prefer insertions inside of a word to a substitution');
l.totalCost().should.equal(1.8);
l.reconstructPath().should.deep.equal([
    { i: 0,  j: 0,  op: 'M', letter: 'p' },
    { i: 1,  j: 1,  op: 'M', letter: 'r' },
    { i: 2,  j: 2,  op: 'M', letter: 'e' },
    { i: 3,  j: 3,  op: 'M', letter: 'f' },
    { i: 4,  j: 4,  op: 'M', letter: 'e' },
    { i: 5,  j: 5,  op: 'M', letter: 'r' },
    { i: 6,  j: 6,  op: 'M', letter: ' ' },
    { i: 7,  j: 7,  op: 'M', letter: 'i' },
    { i: 8,  j: 8,  op: 'M', letter: 'n' },
    { i: 9,  j: 9,  op: 'M', letter: 's' },
    { i: 10, j: 10, op: 'I', letter: 'e' },
    { i: 10, j: 11, op: 'M', letter: 'r' },
    { i: 11, j: 12, op: 'M', letter: 't' },
    { i: 12, j: 13, op: 'I', letter: 'i' },
    { i: 12, j: 14, op: 'M', letter: 'o' },
    { i: 13, j: 15, op: 'I', letter: 'n' },
    { i: 13, j: 16, op: 'I', letter: 's' },
    { i: 13, j: 17, op: 'I', letter: ' ' },
    { i: 13, j: 18, op: 'I', letter: 'i' },
    { i: 13, j: 19, op: 'I', letter: 'n' },
    { i: 13, j: 20, op: 'I', letter: 's' },
    { i: 13, j: 21, op: 'I', letter: 'i' },
    { i: 13, j: 22, op: 'I', letter: 'd' },
    { i: 13, j: 23, op: 'I', letter: 'e' },
    { i: 13, j: 24, op: 'M', letter: ' ' },
    { i: 14, j: 25, op: 'I', letter: 'o' },
    { i: 14, j: 26, op: 'M', letter: 'f' }
]);
```

# API

To de JSDoc'd!

# License

MIT
