export var capitalize = function (a) { return a.charAt(0).toUpperCase() + a.substring(1); };
export var entries = function (o) {
    var xs = [];
    for (var _i = 0, _a = Object.keys(o); _i < _a.length; _i++) {
        var key = _a[_i];
        xs.push([key, o[key]]);
    }
    return xs;
};
export var equals = function (a, b) {
    if (a === b)
        return true;
    var typeA = typeof a;
    if (typeA !== typeof b || typeA !== 'object')
        return false;
    if (Array.isArray(a)) {
        if (a.length !== b.length)
            return false;
        for (var i = 0; i < a.length; i++)
            if (!equals(a[i], b[i]))
                return false;
        return true;
    }
    var keysA = Object.keys(a);
    var keysB = Object.keys(b);
    if (keysA.length !== keysB.length)
        return false;
    for (var i = 0; i < keysA.length; i++) {
        var key = keysA[i];
        if (!equals(a[key], b[key]))
            return false;
    }
    return true;
};
export var find = function (f, xs) {
    for (var i = 0; i < xs.length; i++)
        if (f(xs[i]))
            return xs[i];
};
export var mapObj = function (f, o) {
    var p = {};
    for (var key in o)
        if (Object.prototype.hasOwnProperty.call(o, key))
            p[key] = f(o[key]);
    return p;
};
export var values = function (obj) {
    var keys = Object.keys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; i++)
        ret[i] = obj[keys[i]];
    return ret;
};
