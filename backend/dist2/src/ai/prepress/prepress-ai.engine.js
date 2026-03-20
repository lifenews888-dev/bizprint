"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepressAIEngine = void 0;
class PrepressAIEngine {
    static analyze(input) {
        const issues = [];
        if (input.dpi < 300)
            issues.push("LOW_DPI");
        if (input.bleed_mm < 3)
            issues.push("BLEED_TOO_SMALL");
        if (input.color_mode !== "CMYK")
            issues.push("COLOR_NOT_CMYK");
        if (!input.fonts_embedded)
            issues.push("FONTS_NOT_EMBEDDED");
        return {
            safe: issues.length === 0,
            issues
        };
    }
}
exports.PrepressAIEngine = PrepressAIEngine;
//# sourceMappingURL=prepress-ai.engine.js.map