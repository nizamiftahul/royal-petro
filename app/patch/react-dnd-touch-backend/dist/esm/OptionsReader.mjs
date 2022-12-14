export class OptionsReader {
    get delay() {
        var _delay;
        return (_delay = this.args.delay) !== null && _delay !== void 0 ? _delay : 0;
    }
    get scrollAngleRanges() {
        return this.args.scrollAngleRanges;
    }
    get getDropTargetElementsAtPoint() {
        return this.args.getDropTargetElementsAtPoint;
    }
    get ignoreContextMenu() {
        var _ignoreContextMenu;
        return (_ignoreContextMenu = this.args.ignoreContextMenu) !== null && _ignoreContextMenu !== void 0 ? _ignoreContextMenu : false;
    }
    get enableHoverOutsideTarget() {
        var _enableHoverOutsideTarget;
        return (_enableHoverOutsideTarget = this.args.enableHoverOutsideTarget) !== null && _enableHoverOutsideTarget !== void 0 ? _enableHoverOutsideTarget : false;
    }
    get enableKeyboardEvents() {
        var _enableKeyboardEvents;
        return (_enableKeyboardEvents = this.args.enableKeyboardEvents) !== null && _enableKeyboardEvents !== void 0 ? _enableKeyboardEvents : false;
    }
    get enableMouseEvents() {
        var _enableMouseEvents;
        return (_enableMouseEvents = this.args.enableMouseEvents) !== null && _enableMouseEvents !== void 0 ? _enableMouseEvents : false;
    }
    get enableTouchEvents() {
        var _enableTouchEvents;
        return (_enableTouchEvents = this.args.enableTouchEvents) !== null && _enableTouchEvents !== void 0 ? _enableTouchEvents : true;
    }
    get touchSlop() {
        return this.args.touchSlop || 0;
    }
    get delayTouchStart() {
        var ref, ref1;
        var ref2, ref3;
        return (ref3 = (ref2 = (ref = this.args) === null || ref === void 0 ? void 0 : ref.delayTouchStart) !== null && ref2 !== void 0 ? ref2 : (ref1 = this.args) === null || ref1 === void 0 ? void 0 : ref1.delay) !== null && ref3 !== void 0 ? ref3 : 0;
    }
    get delayMouseStart() {
        var ref, ref4;
        var ref5, ref6;
        return (ref6 = (ref5 = (ref = this.args) === null || ref === void 0 ? void 0 : ref.delayMouseStart) !== null && ref5 !== void 0 ? ref5 : (ref4 = this.args) === null || ref4 === void 0 ? void 0 : ref4.delay) !== null && ref6 !== void 0 ? ref6 : 0;
    }
    get window() {
        if (this.context && this.context.window) {
            return this.context.window;
        } else if (typeof window !== 'undefined') {
            return window;
        }
        return undefined;
    }
    get document() {
        var ref;
        if ((ref = this.context) === null || ref === void 0 ? void 0 : ref.document) {
            return this.context.document;
        }
        if (this.window) {
            return this.window.document;
        }
        return undefined;
    }
    get rootElement() {
        var ref;
        return ((ref = this.args) === null || ref === void 0 ? void 0 : ref.rootElement) || this.document;
    }
    constructor(args, context){
        this.args = args;
        this.context = context;
    }
}

//# sourceMappingURL=OptionsReader.mjs.map