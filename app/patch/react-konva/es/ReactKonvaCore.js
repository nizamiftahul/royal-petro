/**
 * Based on ReactArt.js
 * Copyright (c) 2017-present Lavrenov Anton.
 * All rights reserved.
 *
 * MIT
 */
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import React from 'react';
import Konva from 'konva/lib/Core';
import ReactFiberReconciler from 'react-reconciler';
import * as HostConfig from './ReactKonvaHostConfig';
import { applyNodeProps, toggleStrictMode } from './makeUpdates';

function usePrevious(value) {
  var ref = React.useRef();
  React.useLayoutEffect(function () {
    ref.current = value;
  });
  return ref.current;
}

var StageWrap = function StageWrap(props) {
  var container = React.useRef();
  var stage = React.useRef();
  var fiberRef = React.useRef();

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

  React.useLayoutEffect(function () {
    stage.current = new Konva.Stage({
      width: props.width,
      height: props.height,
      container: container.current
    });

    _setRef(stage.current);

    fiberRef.current = KonvaRenderer.createContainer(stage.current);
    KonvaRenderer.updateContainer(props.children, fiberRef.current);

    return function () {
      if (!Konva.isBrowser) {
        return;
      }
      _setRef(null);
      KonvaRenderer.updateContainer(null, fiberRef.current, null);
      stage.current.destroy();
    };
  }, []);

  React.useLayoutEffect(function () {
    _setRef(stage.current);
    applyNodeProps(stage.current, props, oldProps);
    KonvaRenderer.updateContainer(props.children, fiberRef.current, null);
  });

  return React.createElement('div', {
    ref: container,
    accessKey: props.accessKey,
    className: props.className,
    role: props.role,
    style: props.style,
    tabIndex: props.tabIndex,
    title: props.title
  });
};

export var Layer = 'Layer';
export var FastLayer = 'FastLayer';
export var Group = 'Group';
export var Label = 'Label';
export var Rect = 'Rect';
export var Circle = 'Circle';
export var Ellipse = 'Ellipse';
export var Wedge = 'Wedge';
export var Line = 'Line';
export var Sprite = 'Sprite';
export var Image = 'Image';
export var Text = 'Text';
export var TextPath = 'TextPath';
export var Star = 'Star';
export var Ring = 'Ring';
export var Arc = 'Arc';
export var Tag = 'Tag';
export var Path = 'Path';
export var RegularPolygon = 'RegularPolygon';
export var Arrow = 'Arrow';
export var Shape = 'Shape';
export var Transformer = 'Transformer';

var KonvaRenderer = ReactFiberReconciler(HostConfig);

KonvaRenderer.injectIntoDevTools({
  findHostInstanceByFiber: function findHostInstanceByFiber() {
    return null;
  },
  bundleType: process.env.NODE_ENV !== 'production' ? 1 : 0,
  version: React.version,
  rendererPackageName: 'react-konva'
});

export var Stage = React.forwardRef(function (props, ref) {
  return React.createElement(StageWrap, _extends({}, props, { forwardedRef: ref }));
});

export var useStrictMode = toggleStrictMode;