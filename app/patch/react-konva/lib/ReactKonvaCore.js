/**
 * Based on ReactArt.js
 * Copyright (c) 2017-present Lavrenov Anton.
 * All rights reserved.
 *
 * MIT
 */
'use strict';

exports.__esModule = true;
exports.useStrictMode = exports.Stage = exports.Transformer = exports.Shape = exports.Arrow = exports.RegularPolygon = exports.Path = exports.Tag = exports.Arc = exports.Ring = exports.Star = exports.TextPath = exports.Text = exports.Image = exports.Sprite = exports.Line = exports.Wedge = exports.Ellipse = exports.Circle = exports.Rect = exports.Label = exports.Group = exports.FastLayer = exports.Layer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Core = require('konva/lib/Core');

var _Core2 = _interopRequireDefault(_Core);

var _reactReconciler = require('react-reconciler');

var _reactReconciler2 = _interopRequireDefault(_reactReconciler);

var _ReactKonvaHostConfig = require('./ReactKonvaHostConfig');

var HostConfig = _interopRequireWildcard(_ReactKonvaHostConfig);

var _makeUpdates = require('./makeUpdates');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function usePrevious(value) {
  var ref = _react2.default.useRef();
  _react2.default.useLayoutEffect(function () {
    ref.current = value;
  });
  return ref.current;
}

var StageWrap = function StageWrap(props) {
  var container = _react2.default.useRef();
  var stage = _react2.default.useRef();
  var fiberRef = _react2.default.useRef();

  var oldProps = usePrevious(props);

  var _setRef = function _setRef(stage) {
    var forwardedRef = props.forwardedRef;

    if (!forwardedRef) {
      return;
    }
    if (typeof forwardedRef === 'function') {
      forwardedRef(stage);
    } else {
      forwardedRef.current = stage;
    }
  };

  _react2.default.useLayoutEffect(function () {
    stage.current = new _Core2.default.Stage({
      width: props.width,
      height: props.height,
      container: container.current
    });

    _setRef(stage.current);

    fiberRef.current = KonvaRenderer.createContainer(stage.current);
    KonvaRenderer.updateContainer(props.children, fiberRef.current);

    return function () {
      if (!_Core2.default.isBrowser) {
        return;
      }
      _setRef(null);
      KonvaRenderer.updateContainer(null, fiberRef.current, null);
      stage.current.destroy();
    };
  }, []);

  _react2.default.useLayoutEffect(function () {
    _setRef(stage.current);
    (0, _makeUpdates.applyNodeProps)(stage.current, props, oldProps);
    KonvaRenderer.updateContainer(props.children, fiberRef.current, null);
  });

  return _react2.default.createElement('div', {
    ref: container,
    accessKey: props.accessKey,
    className: props.className,
    role: props.role,
    style: props.style,
    tabIndex: props.tabIndex,
    title: props.title
  });
};

var Layer = exports.Layer = 'Layer';
var FastLayer = exports.FastLayer = 'FastLayer';
var Group = exports.Group = 'Group';
var Label = exports.Label = 'Label';
var Rect = exports.Rect = 'Rect';
var Circle = exports.Circle = 'Circle';
var Ellipse = exports.Ellipse = 'Ellipse';
var Wedge = exports.Wedge = 'Wedge';
var Line = exports.Line = 'Line';
var Sprite = exports.Sprite = 'Sprite';
var Image = exports.Image = 'Image';
var Text = exports.Text = 'Text';
var TextPath = exports.TextPath = 'TextPath';
var Star = exports.Star = 'Star';
var Ring = exports.Ring = 'Ring';
var Arc = exports.Arc = 'Arc';
var Tag = exports.Tag = 'Tag';
var Path = exports.Path = 'Path';
var RegularPolygon = exports.RegularPolygon = 'RegularPolygon';
var Arrow = exports.Arrow = 'Arrow';
var Shape = exports.Shape = 'Shape';
var Transformer = exports.Transformer = 'Transformer';

var KonvaRenderer = (0, _reactReconciler2.default)(HostConfig);

KonvaRenderer.injectIntoDevTools({
  findHostInstanceByFiber: function findHostInstanceByFiber() {
    return null;
  },
  bundleType: process.env.NODE_ENV !== 'production' ? 1 : 0,
  version: _react2.default.version,
  rendererPackageName: 'react-konva'
});

var Stage = exports.Stage = _react2.default.forwardRef(function (props, ref) {
  return _react2.default.createElement(StageWrap, _extends({}, props, { forwardedRef: ref }));
});

var useStrictMode = exports.useStrictMode = _makeUpdates.toggleStrictMode;