var q = require('q');
var R = require('ramda');

var handleSuppliedCb = function invokeFnAsPromiseAndPropagateResultsToCb (promise, cb) {
	var handleResolve = R.partial(cb, null);
	var handleReject  = R.partialRight(cb, undefined);
	return promise.then(handleResolve, handleReject);
};

var invokeFnAsPromise = function invokeFnAsPromise (fn, fnArgs) {
	return q.fapply(fn, fnArgs);
};

var promisifyErrorFirstCbFunc = function promisifyErrorFirstCbFunc (fn /* [, n args, callback?] */) {
	var allArgs        = R.tail(arguments);
	var allArgsMinusCb = R.dropLast(1, allArgs);
	var cbArg          = R.last(allArgs);
	var fnAsPromise    = R.partial(invokeFnAsPromise, fn);

	var handleCbAndReturnPromise = function () {
		var promise = fnAsPromise(allArgsMinusCb);
		handleSuppliedCb(promise, cbArg);
		return promise;
	};

	var isQualifiedCbArg = function () {
		return (
			(allArgs.length === (fn.length + 1)) &&
			R.is(Function, cbArg)
		);
	};

	return isQualifiedCbArg() ? handleCbAndReturnPromise() : fnAsPromise(allArgs);
};

module.exports = function _export (fn /*: function*/) {
	return R.curryN(fn.length, R.partial(promisifyErrorFirstCbFunc, fn));
};