export class PrepressAIEngine {

  static analyze(input: any) {

    const issues: string[] = []

    if (input.dpi < 300) issues.push("LOW_DPI")

    if (input.bleed_mm < 3) issues.push("BLEED_TOO_SMALL")

    if (input.color_mode !== "CMYK") issues.push("COLOR_NOT_CMYK")

    if (!input.fonts_embedded) issues.push("FONTS_NOT_EMBEDDED")

    return {
      safe: issues.length === 0,
      issues
    }

  }

}