var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

global.expect = chai.expect;
global.sinon = sinon;

// put babel options here
require('babel/register')({
});
