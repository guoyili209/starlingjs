// =================================================================================================
//
//	Starling Framework
//	Copyright Gamua GmbH. All Rights Reserved.
//
//	This program is free software. You can redistribute and/or modify it
//	in accordance with the terms of the accompanying license agreement.
//
// =================================================================================================

module StarlingJS {
    export class SystemUtil {
        private static sInitialized: Boolean = false;
        private static sApplicationActive: Boolean = true;
        private static sWaitingCalls: Array<any> = [];
        private static sPlatform: String;
        private static sVersion: String;
        private static sAIR: Boolean;
        private static sEmbeddedFonts: Array<any> = null;
        private static sSupportsDepthAndStencil: Boolean = true;

        /** @private */
        constructor() { throw new AbstractClassError(); }

        /** Initializes the <code>ACTIVATE/DEACTIVATE</code> event handlers on the native
         *  application. This method is automatically called by the Starling constructor. */
        public static initialize(): void {
            if (SystemUtil.sInitialized) return;

            SystemUtil.sInitialized = true;
            // SystemUtil.sPlatform = Capabilities.version.substr(0, 3);
            // SystemUtil.sVersion = Capabilities.version.substr(4);

            // try
            // {
            //     var nativeAppClass:Object = getDefinitionByName("flash.desktop::NativeApplication");
            //     var nativeApp:EventDispatcher = nativeAppClass["nativeApplication"] as EventDispatcher;

            //     nativeApp.addEventListener(Event.ACTIVATE, onActivate, false, 0, true);
            //     nativeApp.addEventListener(Event.DEACTIVATE, onDeactivate, false, 0, true);

            //     var appDescriptor:XML = nativeApp["applicationDescriptor"];
            //     var ns:Namespace = appDescriptor.namespace();
            //     var ds:String = appDescriptor.ns::initialWindow.ns::depthAndStencil.toString().toLowerCase();

            //     sSupportsDepthAndStencil = (ds == "true");
            //     sAIR = true;
            // }
            // catch (e:Error)
            // {
            //     sAIR = false;
            // }
        }

        // private static onActivate(event: Object): void {
        //     SystemUtil.sApplicationActive = true;

        //     for each(var call: Array in sWaitingCalls)
        //     {
        //         try { call[0].apply(null, call[1]); }
        //         catch (e: Error) {
        //             trace("[Starling] Error in 'executeWhenApplicationIsActive' call:", e.message);
        //         }
        //     }

        //     SystemUtil.sWaitingCalls = [];
        // }

        // private static onDeactivate(event: Object): void {
        //     SystemUtil.sApplicationActive = false;
        // }

        // /** Executes the given function with its arguments the next time the application is active.
        //  *  (If it <em>is</em> active already, the call will be executed right away.) */
        // public static executeWhenApplicationIsActive(call: Function, ...args): void {
        //     initialize();

        //     if (sApplicationActive) call.apply(null, args);
        //     else sWaitingCalls.push([call, args]);
        // }

        // /** Indicates if the application is currently active. On Desktop, this means that it has
        //  *  the focus; on mobile, that it is in the foreground. In the Flash Plugin, always
        //  *  returns true. */
        // public static get isApplicationActive(): Boolean {
        //     initialize();
        //     return sApplicationActive;
        // }

        // /** Indicates if the code is executed in an Adobe AIR runtime (true)
        //  *  or Flash plugin/projector (false). */
        // public static get isAIR(): Boolean {
        //     initialize();
        //     return sAIR;
        // }

        // /** Returns the Flash Player/AIR version string. The format of the version number is:
        //  *  <em>majorVersion,minorVersion,buildNumber,internalBuildNumber</em>. */
        // public static get version(): String {
        //     initialize();
        //     return sVersion;
        // }

        // /** Returns the three-letter platform string of the current system. These are
        //  *  the most common platforms: <code>WIN, MAC, LNX, IOS, AND, QNX</code>. Except for the
        //  *  last one, which indicates "Blackberry", all should be self-explanatory.
        //  *
        //  *  <p>For debugging purposes, you can also assign a custom value.</p> */
        // public static get platform(): String {
        //     initialize();
        //     return sPlatform;
        // }

        // public static set platform(value: String): void {
        //     initialize();
        //     sPlatform = value;
        // }

        // /** Returns the value of the 'initialWindow.depthAndStencil' node of the application
        //  *  descriptor, if this in an AIR app; otherwise always <code>true</code>. */
        // public static get supportsDepthAndStencil(): Boolean {
        //     return sSupportsDepthAndStencil;
        // }

        // /** Indicates if the current platform and runtime support video textures.  */
        // public static get supportsVideoTexture(): Boolean {
        //     return Context3D["supportsVideoTexture"];
        // }

        // // embedded fonts

        // /** Updates the list of embedded fonts. To be called when a font is loaded at runtime. */
        // public static updateEmbeddedFonts(): void {
        //     sEmbeddedFonts = null; // will be updated in 'isEmbeddedFont()'
        // }

        // /** Figures out if an embedded font with the specified style is available.
        //  *  The fonts are enumerated only once; if you load a font at runtime, be sure to call
        //  *  'updateEmbeddedFonts' before calling this method.
        //  *
        //  *  @param fontName  the name of the font
        //  *  @param bold      indicates if the font has a bold style
        //  *  @param italic    indicates if the font has an italic style
        //  *  @param fontType  the type of the font (one of the constants defined in the FontType class)
        //  */
        // public static isEmbeddedFont(fontName: String, bold: Boolean = false, italic: Boolean = false,
        //     fontType: String = "embedded"): Boolean {
        //     if (sEmbeddedFonts == null)
        //         sEmbeddedFonts = Font.enumerateFonts(false);

        //     for each(var font: Font in sEmbeddedFonts)
        //     {
        //         var style: String = font.fontStyle;
        //         var isBold: Boolean = style == FontStyle.BOLD || style == FontStyle.BOLD_ITALIC;
        //         var isItalic: Boolean = style == FontStyle.ITALIC || style == FontStyle.BOLD_ITALIC;

        //         if (fontName == font.fontName && bold == isBold && italic == isItalic &&
        //             fontType == font.fontType) {
        //             return true;
        //         }
        //     }

        //     return false;
        // }

        // // convenience methods

        // /** Indicates if the code is executed on an iOS device, based on the <code>platform</code>
        //  *  string. */
        // public static get isIOS(): Boolean {
        //     return platform == "IOS";
        // }

        // /** Indicates if the code is executed on an Android device, based on the
        //  *  <code>platform</code> string. */
        // public static get isAndroid(): Boolean {
        //     return platform == "AND";
        // }

        // /** Indicates if the code is executed on a Macintosh, based on the <code>platform</code>
        //  *  string. */
        // public static get isMac(): Boolean {
        //     return platform == "MAC";
        // }

        // /** Indicates if the code is executed on Windows, based on the <code>platform</code>
        //  *  string. */
        // public static get isWindows(): Boolean {
        //     return platform == "WIN";
        // }

        // /** Indicates if the code is executed on a Desktop computer with Windows, macOS or Linux
        //  *  operating system. If the method returns 'false', it's probably a mobile device
        //  *  or a Smart TV. */
        // public static get isDesktop(): Boolean {
        //     return platform == "WIN" || platform == "MAC" || platform == "LNX";
        // }
    }
}