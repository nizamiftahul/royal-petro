import type { TouchBackendOptions, AngleRange, TouchBackendContext } from './interfaces.js';
export declare class OptionsReader implements TouchBackendOptions {
    private args;
    private context;
    constructor(args: Partial<TouchBackendOptions>, context: TouchBackendContext);
    get delay(): number;
    get scrollAngleRanges(): AngleRange[] | undefined;
    get getDropTargetElementsAtPoint(): ((x: number, y: number, elements: HTMLElement[]) => HTMLElement[]) | undefined;
    get ignoreContextMenu(): boolean;
    get enableHoverOutsideTarget(): boolean;
    get enableKeyboardEvents(): boolean;
    get enableMouseEvents(): boolean;
    get enableTouchEvents(): boolean;
    get touchSlop(): number;
    get delayTouchStart(): number;
    get delayMouseStart(): number;
    get window(): Window | undefined;
    get document(): Document | undefined;
    get rootElement(): Node | undefined;
}
