# Intro

Calculate Levenshtein distance and much more!

# Install

```bash
$ bower install levenshtein-toolbox --save
```

Use your favorite flavor in the `dist/` directory.

# Usage

Not only can you calculate the edit distance between any two strings with this library. You can also:

## View and act on detailed information in each step

You can view each step taken in the process of converting your pattern string (first string) against a substring of the given text (second string). Use this information to make your own assessments like max inserts/deletes and matches/len

Examples:

```javascript
var l = new Levenshtein();
var matches = 0;
var substitutions = 0;
var inserts = 0;
var deletes = 0;
var patternString = 'wheel';
var text = 'hello';
var len = patternString.length;

function countActions(node) {
    switch (node.op) {
        case 'M': matches++; break;
        case 'S': substitutions++; break;
        case 'I': inserts++; break;
        case 'D': deletes++; break;
        default: break;
    }
}

l.process(patternString, text);
l.recursePath(countActions);

matches.should.equal(3);
substitutions.should.equal(1);
inserts.should.equal(1);
deletes.should.equal(1);

if (matches/len > 0.8) {
    console.log('pattern string was mostly matched in the text');
}
```

```javascript
var l = new Levenshtein({
    caseSensitive: false,
});

// reconstruct the path taken converting
// the pattern string to the text

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
```

## Choose edit distance type

Typically edit distance is done against both whole strings, but you can match your pattern string (first string) against a substring of the given text (second string). This means the least-cost match will be found anywhere in the text, and insertions up to that point are zero cost. Just put `type: substring` into the options object passed into the constructor function. Otherwise `type: whole` is the default, and the edit distance will be calculated starting at the beginning of the text (any insertions will cost).

Examples:

```javascript
var patternString = 'science';
var text = 'do it for science!!';
var l = new Levenshtein({
    caseSensitive: false,
});

l.process(patternString, text);
// insert eveything up to 'science', then insert the exclamations
// inserts have a cost of 1 by default
l.totalCost().should.equal(12);

var l = new Levenshtein({
    caseSensitive: false,
    type: 'substring',
});

l.process(patternString, text);
l.totalCost().should.equal(0);
```

## Directly influence which path is taken

Introduce your own custom weight functions for the three string operations: matching/substitution, char insertion, and char deletion, and you'll have total control over how 

All initial insertions when `type: substring` are free until the cheapest path begins at the start of the substring, when insertions will start to cost. If `type: whole`, insertions will cost starting from the first char onward.

Examples:

```javascript
// the "matchCost" function dictates the cost when both
// letters in both strings match, and if they don't match,
// the cost of doing a substitution from the first to the second.
// you can even vary the cost depending on the letters being compared.
function matchCost(c1, c2) {
    if (c1 === c2) {
        return 0;
    }

    // don't substitute a space char; keeps search words separate
    if (c1 === ' ' || c2 === ' ') {
        return Infinity;
    }

    return 1;
}

// the "insertCost" is the cost of insertion of a letter in the text
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

var l = new Levenshtein({
    caseSensitive: false,
    type: 'substring',
});

// you can set cost functions or a numeric value
l.set('matchCost', matchCost);
l.set('insertCost', insertCost);
// this will make the algorithm prefer
// a path that doesn't include deletions
l.set('deleteCost', Infinity);

l.process('prefer insertios', 'prefer insertions inside of a word to a substitution');
l.totalCost().should.equal(0.9);
l.reconstructPath().should.deep.equal(
    [ { i: 0, j: 0, op: 'M', letter: 'p' },
    { i: 1, j: 1, op: 'M', letter: 'r' },
    { i: 2, j: 2, op: 'M', letter: 'e' },
    { i: 3, j: 3, op: 'M', letter: 'f' },
    { i: 4, j: 4, op: 'M', letter: 'e' },
    { i: 5, j: 5, op: 'M', letter: 'r' },
    { i: 6, j: 6, op: 'M', letter: ' ' },
    { i: 7, j: 7, op: 'M', letter: 'i' },
    { i: 8, j: 8, op: 'M', letter: 'n' },
    { i: 9, j: 9, op: 'M', letter: 's' },
    { i: 10, j: 10, op: 'M', letter: 'e' },
    { i: 11, j: 11, op: 'M', letter: 'r' },
    { i: 12, j: 12, op: 'M', letter: 't' },
    { i: 13, j: 13, op: 'M', letter: 'i' },
    { i: 14, j: 14, op: 'M', letter: 'o' },
//
// if the insertionCost were `1` instead of `0.9`,
// this last bit would look like this:
//  { i: 15, j: 15, op: 'S', from: 's', to: 'n' } ]
// and the cost would be `1`.
//
// since the insertionCost is `0.9`, though, the algorithm
// performs the cheaper insertion and matches the letter `s` instead.
//
    { i: 15, j: 15, op: 'I', letter: 'n' },
    { i: 15, j: 16, op: 'M', letter: 's' } ]
);

// notice here how the insertions at the end of a word have no cost.
// the only costs here are the insertions inside the "word" `insrto`.
l.process('prefer insrto f', 'prefer insertions inside of a word to a substitution');
l.totalCost().should.equal(1.8);
l.reconstructPath().should.deep.equal(
    [ { i: 0, j: 0, op: 'M', letter: 'p' },
    { i: 1, j: 1, op: 'M', letter: 'r' },
    { i: 2, j: 2, op: 'M', letter: 'e' },
    { i: 3, j: 3, op: 'M', letter: 'f' },
    { i: 4, j: 4, op: 'M', letter: 'e' },
    { i: 5, j: 5, op: 'M', letter: 'r' },
    { i: 6, j: 6, op: 'M', letter: ' ' },
    { i: 7, j: 7, op: 'M', letter: 'i' },
    { i: 8, j: 8, op: 'M', letter: 'n' },
    { i: 9, j: 9, op: 'M', letter: 's' },
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
    { i: 14, j: 26, op: 'M', letter: 'f' } ]
);
```

# API

To de JSDoc'd!

# License

MIT
