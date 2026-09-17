/*
 * 无头思维链提取 + Reasoning 面板美化（iframe 脚本版 / 纯 JS）
 * 规则：提取 reasoning，并把命中的 think 段从正文移除
 * 当前主题：黑金诗卷（固定标题“ASTRAEA”）
 */

(function () {
  const DEBUG = true;
  const SCRIPT_ID = typeof getScriptId === 'function' ? getScriptId() : 'reasoning_regex_styler';
  const STYLE_ID = `reasoning-style-${SCRIPT_ID}`;
  const FIXED_REASONING_TITLE = 'ASTRAEA';

  // 1. 配置注入：通过获取酒馆 Context 强行修改原生解析器配置
  function injectConfig() {
    const context = getST()?.getContext?.();
    const config = context?.powerUserSettings?.reasoning;
    if (config) {
      config.auto_parse = true;
      config.prefix = '<think>';
      config.suffix = '</think>';
      log('Config injected to ST via Context API');
    } else {
      log('Failed to inject config: Context or powerUserSettings not found');
    }
  }

  function getReasoningConfig() {
    const context = getST()?.getContext?.();
    const config = context?.powerUserSettings?.reasoning;
    if (config) {
      return {
        prefix: config.prefix || '<think>',
        suffix: config.suffix || '</think>',
        auto_expand: config.auto_expand
      };
    }
    return { prefix: '<think>', suffix: '</think>', auto_expand: true };
  }

  const REASONING_CSS = String.raw`
:root,
#chat {
    --qqz-gold-1: rgba(92, 70, 34, 0.24);
    --qqz-gold-2: rgba(112, 86, 42, 0.3);
    --qqz-gold-3: rgba(158, 124, 58, 0.68);
    --qqz-gold-4: rgba(198, 178, 134, 0.76);
    --qqz-gold-soft: rgba(112, 86, 42, 0.055);
    --qqz-gold-glow: rgba(158, 124, 58, 0.08);
    --qqz-bg-1: #050709;
    --qqz-bg-2: #090c10;
    --qqz-bg-3: #07090d;
    --qqz-text-main: #DDD2B7;
    --qqz-text-sec: rgba(181, 154, 98, 0.64);
    --qqz-text-dim: rgba(214, 201, 172, 0.54);
}

.mes_reasoning_details {
    position: relative !important;
    margin: 6px 0 9px !important;
    width: 100% !important;
    background:
        radial-gradient(ellipse at 18% 12%, rgba(76, 55, 30, 0.09) 0%, transparent 38%),
        radial-gradient(ellipse at 78% 86%, rgba(54, 40, 25, 0.1) 0%, transparent 42%),
        radial-gradient(circle at 42% 62%, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 4px),
        linear-gradient(153deg, rgba(255, 255, 255, 0.012) 0%, transparent 24%, rgba(0, 0, 0, 0.12) 68%, transparent 100%),
        linear-gradient(180deg, #07080a 0%, #0b0c10 48%, #07080a 100%) !important;
    border: 2px solid rgba(44, 35, 23, 0.95) !important;
    border-top-color: rgba(76, 58, 34, 0.7) !important;
    border-right-color: rgba(32, 25, 18, 0.95) !important;
    border-bottom-color: rgba(22, 18, 14, 0.98) !important;
    border-left-color: rgba(70, 52, 31, 0.72) !important;
    border-radius: 3px !important;
    overflow: hidden !important;
    box-shadow:
        0 2px 14px rgba(0, 0, 0, 0.46),
        0 0 0 1px rgba(36, 25, 12, 0.68),
        inset 0 1px 0 rgba(176, 148, 100, 0.035),
        inset 0 0 0 1px rgba(92, 70, 34, 0.055),
        inset 0 18px 24px rgba(255, 244, 214, 0.01),
        inset 0 -22px 34px rgba(0, 0, 0, 0.3) !important;
}

.mes_reasoning_details::before,
.mes_reasoning_details::after {
    content: "" !important;
    position: absolute !important;
    pointer-events: none !important;
    z-index: 1 !important;
}

.mes_reasoning_details::before {
    inset: 6px !important;
    opacity: 0.12 !important;
    background:
        radial-gradient(circle at 16% 18%, rgba(132, 104, 58, 0.5) 0 1px, transparent 2px),
        radial-gradient(circle at 83% 22%, rgba(104, 84, 52, 0.45) 0 1px, transparent 2px),
        radial-gradient(circle at 72% 78%, rgba(92, 72, 44, 0.45) 0 1px, transparent 2px) !important;
    background-size: 37px 29px, 53px 41px, 47px 61px !important;
}

.mes_reasoning_details::after {
    top: 8px !important;
    right: 14px !important;
    width: 54px !important;
    height: 54px !important;
    opacity: 0.1 !important;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23836a43' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'><path d='M32 7c8 7 15 7 22 7-1 19-8 32-22 43C18 46 11 33 10 14c7 0 14 0 22-7Z'/><path d='M32 16v31'/><path d='M20 26c8 2 16 2 24 0'/><path d='M22 37c7 3 13 3 20 0'/></svg>") no-repeat center / contain !important;
}

.mes_reasoning_details[data-state="thinking"] {
    animation: qqz-codex-breathe 4.2s ease-in-out infinite !important;
}

.mes_reasoning_summary {
    position: relative !important;
    margin: 0 !important;
    padding: 10px 18px 10px 18px !important;
    background:
        radial-gradient(ellipse at 4% 44%, rgba(89, 65, 35, 0.06) 0%, transparent 24%),
        radial-gradient(ellipse at 78% 22%, rgba(255, 255, 255, 0.012) 0%, transparent 34%),
        linear-gradient(151deg, rgba(255, 255, 255, 0.01) 0%, transparent 34%, rgba(0, 0, 0, 0.09) 76%, transparent 100%),
        linear-gradient(180deg, rgba(76, 54, 28, 0.045) 0%, rgba(76, 54, 28, 0.014) 62%, rgba(0, 0, 0, 0.02) 100%) !important;
    border: none !important;
    cursor: pointer !important;
    display: block !important;
    width: 100% !important;
    outline: none !important;
    list-style: none !important;
    user-select: none !important;
    transition: background 0.2s ease, border-color 0.2s ease !important;
    box-shadow: inset 0 -1px 0 rgba(43, 30, 14, 0.36) !important;
}

.mes_reasoning_summary::-webkit-details-marker,
.mes_reasoning_summary::marker {
    display: none !important;
}

.mes_reasoning_summary:hover {
    background:
        radial-gradient(ellipse at 4% 44%, rgba(89, 65, 35, 0.075) 0%, transparent 24%),
        radial-gradient(ellipse at 78% 22%, rgba(255, 255, 255, 0.016) 0%, transparent 34%),
        linear-gradient(151deg, rgba(255, 255, 255, 0.012) 0%, transparent 34%, rgba(0, 0, 0, 0.09) 76%, transparent 100%),
        linear-gradient(180deg, rgba(76, 54, 28, 0.052) 0%, rgba(76, 54, 28, 0.016) 62%, rgba(0, 0, 0, 0.02) 100%) !important;
}

.mes_reasoning_details[open] > .mes_reasoning_summary {
    box-shadow: inset 0 -1px 0 rgba(104, 79, 31, 0.18) !important;
}

.mes_reasoning_header_block {
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    width: 100% !important;
    min-height: 34px !important;
    padding: 0 124px 0 6px !important;
    background: transparent !important;
}

.mes_reasoning_header {
    position: relative !important;
    z-index: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: center !important;
    width: min(78%, 680px) !important;
    min-width: 0 !important;
    margin: 0 !important;
    gap: 3px !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}

.mes_reasoning_header .thinking-icon,
.mes_reasoning_header .icon-svg,
.mes_reasoning_arrow {
    display: none !important;
}

.mes_reasoning_header::before {
    content: none !important;
    display: none !important;
}

.mes_reasoning_header_title {
    display: block !important;
    font-size: 0 !important;
    color: transparent !important;
    font-weight: 400 !important;
    margin: 0 !important;
    background: transparent !important;
    position: relative !important;
    transition: opacity 0.35s ease, transform 0.35s ease, filter 0.35s ease !important;
}

.mes_reasoning_header_title::before {
    content: attr(data-custom-title) !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    text-align: left !important;
    vertical-align: bottom !important;
    font-family: "Palatino Linotype", "Book Antiqua", Palatino, "Kaiti SC", "STKaiti", "KaiTi", "SimSun", serif !important;
    font-size: 0.96rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.12em !important;
    padding-left: 0.12em !important;
    color: rgba(181, 144, 73, 0.78) !important;
    text-shadow: none !important;
}

.mes_reasoning_header_title::after {
    content: "" !important;
    position: absolute !important;
    left: -9px !important;
    top: 50% !important;
    width: 34px !important;
    height: 34px !important;
    transform: translateY(-50%) !important;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='none' stroke='%23745c37' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'><path d='M24 6c5 7 11 10 18 10-2 13-7 21-18 28C13 37 8 29 6 16c7 0 13-3 18-10Z'/><path d='M24 14v20'/><path d='M16 21c5 2 11 2 16 0'/><path d='M18 29c4 2 8 2 12 0'/></svg>") no-repeat center / contain !important;
    opacity: 0.16 !important;
    pointer-events: none !important;
    z-index: -1 !important;
}

.mes[data-reasoning-state="thinking"] .mes_reasoning_header_title::before {
    background-image: linear-gradient(90deg, rgba(168, 133, 66, 0.76) 0%, rgba(208, 188, 140, 0.88) 50%, rgba(168, 133, 66, 0.76) 100%) !important;
    background-size: 170% 100% !important;
    background-clip: text !important;
    -webkit-background-clip: text !important;
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    animation: qqz-gold-shimmer 3.6s linear infinite, qqz-title-pulse 3.2s ease-in-out infinite !important;
}

.mes[data-reasoning-state="thinking"] .mes_reasoning_header_title::after {
    opacity: 0.18 !important;
    animation: qqz-line-breathe 2.8s ease-in-out infinite !important;
}

.mes[data-reasoning-state="done"] .mes_reasoning_header_title::before {
    background: none !important;
    color: rgba(176, 140, 72, 0.74) !important;
    -webkit-text-fill-color: initial !important;
    text-shadow: none !important;
}

.mes_reasoning_header_title[data-animating="true"] {
    opacity: 0 !important;
    transform: translateY(4px) !important;
    filter: blur(4px) !important;
}

.qqz_reasoning_tp_meta {
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 3px !important;
    width: min(72vw, 760px) !important;
    max-width: 100% !important;
    margin-top: 5px !important;
    padding: 4px 10px 4px 18px !important;
    background:
        radial-gradient(ellipse at 8% 22%, rgba(86, 64, 36, 0.042) 0%, transparent 34%),
        radial-gradient(ellipse at 34% 76%, rgba(255, 255, 255, 0.008) 0%, transparent 26%),
        linear-gradient(137deg, rgba(255, 255, 255, 0.008) 0%, transparent 34%, rgba(0, 0, 0, 0.035) 100%) !important;
}

.qqz_reasoning_tp_meta::before {
    content: "" !important;
    position: absolute !important;
    left: 2px !important;
    top: 4px !important;
    bottom: 4px !important;
    width: 11px !important;
    opacity: 0.34 !important;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 92' fill='none' stroke='%235d5347' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'><path d='M9 5c1.6 9-1.6 16 0 25 1.6 9-1.6 16 0 25 1.6 9-1.6 16 0 31'/><path d='M9 25c-2 2-3.5 4-4 7'/><path d='M9 50c2 2 3.5 4 4 7'/><path d='M9 73c-2 2-3.5 4-4 7'/></svg>") no-repeat center / contain !important;
    pointer-events: none !important;
}

.qqz_reasoning_tp_meta[hidden] {
    display: none !important;
}

.qqz_reasoning_tp_line {
    position: relative !important;
    display: grid !important;
    grid-template-columns: 4.5em minmax(0, 1fr) !important;
    align-items: center !important;
    column-gap: 10px !important;
    width: 100% !important;
    min-width: 0 !important;
    padding: 3px 0 !important;
    line-height: 1.34 !important;
    color: var(--qqz-text-dim) !important;
    font-family: "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", serif !important;
    font-size: 0.68rem !important;
    letter-spacing: 0.02em !important;
    opacity: 0.96 !important;
}

.qqz_reasoning_tp_line::after {
    content: none !important;
    display: none !important;
}

.qqz_reasoning_tp_line:last-child::after {
    display: none !important;
}

.qqz_reasoning_tp_line[hidden] {
    display: none !important;
}

.qqz_reasoning_tp_label {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 0.4em !important;
    min-width: 3.8em !important;
    color: rgba(160, 163, 169, 0.62) !important;
    font-size: 0.64rem !important;
    letter-spacing: 0.08em !important;
    white-space: nowrap !important;
}

.qqz_reasoning_tp_label::before {
    content: "" !important;
    display: inline-block !important;
    width: 11px !important;
    height: 11px !important;
    flex: none !important;
    background-color: rgba(154, 158, 166, 0.66) !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
    background-size: contain !important;
}

.qqz_reasoning_tp_line--time .qqz_reasoning_tp_label::before {
    -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='8' cy='8' r='5.25'/><path d='M8 4.8v3.5l2.4 1.4'/></svg>") !important;
    mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='8' cy='8' r='5.25'/><path d='M8 4.8v3.5l2.4 1.4'/></svg>") !important;
}

.qqz_reasoning_tp_line--location .qqz_reasoning_tp_label::before {
    -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M8 13.2s-3.4-3.55-3.4-6.2A3.4 3.4 0 0 1 8 3.6 3.4 3.4 0 0 1 11.4 7c0 2.65-3.4 6.2-3.4 6.2Z'/><circle cx='8' cy='7' r='1.2'/></svg>") !important;
    mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M8 13.2s-3.4-3.55-3.4-6.2A3.4 3.4 0 0 1 8 3.6 3.4 3.4 0 0 1 11.4 7c0 2.65-3.4 6.2-3.4 6.2Z'/><circle cx='8' cy='7' r='1.2'/></svg>") !important;
    background-color: rgba(146, 158, 168, 0.64) !important;
}

.qqz_reasoning_tp_line--weather .qqz_reasoning_tp_label::before {
    -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M4.6 11.2h6.15a2.15 2.15 0 0 0 .2-4.3 3.35 3.35 0 0 0-6.24-.95A2.42 2.42 0 0 0 4.6 11.2Z'/></svg>") !important;
    mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M4.6 11.2h6.15a2.15 2.15 0 0 0 .2-4.3 3.35 3.35 0 0 0-6.24-.95A2.42 2.42 0 0 0 4.6 11.2Z'/></svg>") !important;
    background-color: rgba(168, 156, 136, 0.58) !important;
}

.qqz_reasoning_tp_value {
    display: block !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    color: rgba(214, 202, 176, 0.75) !important;
}

@media (max-width: 760px) {
    .mes_reasoning_header_block {
        padding-right: 82px !important;
    }

    .mes_reasoning_header {
        width: 100% !important;
    }

    .qqz_reasoning_tp_meta {
        width: calc(100% + 74px) !important;
        max-width: none !important;
        margin-right: -74px !important;
        padding: 5px 8px 5px 16px !important;
        gap: 4px !important;
    }

    .qqz_reasoning_tp_line {
        grid-template-columns: 4em minmax(0, 1fr) !important;
        align-items: start !important;
        column-gap: 8px !important;
        line-height: 1.42 !important;
    }

    .qqz_reasoning_tp_label {
        padding-top: 0.08em !important;
    }

    .qqz_reasoning_tp_value {
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
        line-height: 1.46 !important;
    }

    .mes_reasoning_actions {
        top: 14px !important;
        transform: translateX(10px) !important;
    }

    .mes_reasoning_summary:hover .mes_reasoning_actions {
        transform: translateX(0) !important;
    }
}

.qqz_reasoning_tp_line--time .qqz_reasoning_tp_value {
    color: rgba(208, 197, 174, 0.78) !important;
}

.qqz_reasoning_tp_line--location .qqz_reasoning_tp_value {
    color: rgba(189, 191, 196, 0.72) !important;
}

.qqz_reasoning_tp_line--weather .qqz_reasoning_tp_value {
    color: rgba(188, 181, 168, 0.68) !important;
}

.mes_reasoning_actions {
    position: absolute !important;
    right: 4px !important;
    top: 50% !important;
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: 8px !important;
    width: auto !important;
    flex: none !important;
    opacity: 0 !important;
    transform: translateY(-50%) translateX(10px) !important;
    transition: opacity 0.25s ease, transform 0.25s ease !important;
    pointer-events: none !important;
    background: transparent !important;
    z-index: 2 !important;
}

.mes_reasoning_summary:hover .mes_reasoning_actions {
    opacity: 1 !important;
    transform: translateY(-50%) translateX(0) !important;
    pointer-events: auto !important;
}

.mes_reasoning_actions button {
    color: var(--qqz-text-sec) !important;
    background: rgba(120, 92, 36, 0.026) !important;
    border: 1px solid rgba(120, 92, 36, 0.11) !important;
    border-radius: 2px !important;
    opacity: 0.82 !important;
    transition: all 0.28s ease !important;
    font-size: 0.79rem !important;
    cursor: pointer !important;
    padding: 2px 7px !important;
    box-shadow: none !important;
}

.mes_reasoning_actions button:hover {
    opacity: 0.96 !important;
    color: rgba(200, 181, 140, 0.82) !important;
    background: rgba(120, 92, 36, 0.05) !important;
    border-color: rgba(167, 132, 67, 0.18) !important;
    transform: translateY(-1px) !important;
    box-shadow: none !important;
}

.mes_reasoning {
    margin: 0 !important;
    padding: 13px 20px 15px !important;
    border-top: 1px solid rgba(77, 57, 29, 0.26) !important;
    border-left: 1px solid rgba(93, 68, 35, 0.18) !important;
    color: var(--qqz-text-main) !important;
    font-family: "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", serif !important;
    font-size: 0.93em !important;
    line-height: 1.92 !important;
    letter-spacing: 0.035em !important;
    background:
        radial-gradient(ellipse at 91% 18%, rgba(82, 61, 34, 0.03) 0%, transparent 28%),
        radial-gradient(circle at 33% 72%, rgba(255, 255, 255, 0.008) 0 1px, transparent 1px 5px),
        linear-gradient(147deg, rgba(255, 255, 255, 0.007) 0%, transparent 32%, rgba(0, 0, 0, 0.08) 76%, transparent 100%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.006) 0%, rgba(255, 255, 255, 0.002) 100%) !important;
    box-shadow: inset 0 12px 18px rgba(255, 244, 214, 0.008), inset 0 -18px 24px rgba(0, 0, 0, 0.18) !important;
    max-height: 400px;
    overflow-y: auto;
    text-align: justify !important;
    scrollbar-gutter: stable !important;
    scrollbar-width: thin;
    scrollbar-color: rgba(120, 92, 36, 0.22) rgba(255, 255, 255, 0.012);
}

.mes_reasoning::-webkit-scrollbar {
    width: 8px;
}

.mes_reasoning::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.03);
}

.mes_reasoning::-webkit-scrollbar-thumb {
    background: rgba(185, 145, 60, 0.32);
    border-radius: 999px;
}

.mes_reasoning_details[open] .mes_reasoning {
    animation: qqz-codex-reveal 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    transform-origin: top !important;
}

.mes_reasoning ul,
.mes_reasoning ol {
    padding-left: 1.8em !important;
    margin-top: 0.8em !important;
    margin-bottom: 0.8em !important;
}

.mes_reasoning li {
    margin-bottom: 0.6em !important;
}

.mes_reasoning blockquote {
    margin: 0.9em 0 !important;
    padding: 0.45em 0 0.45em 1em !important;
    border-left: 1px solid rgba(128, 98, 38, 0.32) !important;
    background: rgba(150, 116, 46, 0.03) !important;
    color: var(--qqz-text-main) !important;
}

.mes_reasoning p {
    margin-top: 0.8em !important;
    margin-bottom: 0.8em !important;
}

.mes_reasoning > *:first-child {
    margin-top: 0 !important;
}

.mes_reasoning > *:last-child {
    margin-bottom: 0 !important;
}

@keyframes qqz-codex-breathe {
    0%, 100% {
        box-shadow:
            0 1px 8px rgba(0, 0, 0, 0.42),
            0 0 0 1px rgba(128, 98, 38, 0.05),
            inset 0 1px 0 rgba(255, 244, 214, 0.02);
    }
    50% {
        box-shadow:
            0 1px 10px rgba(0, 0, 0, 0.48),
            0 0 0 1px rgba(150, 116, 46, 0.1),
            inset 0 1px 0 rgba(255, 244, 214, 0.035);
    }
}

@keyframes qqz-gold-shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
}

@keyframes qqz-title-pulse {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 1; }
}

@keyframes qqz-line-breathe {
    0%, 100% { opacity: 0.58; transform: scaleX(0.96); }
    50% { opacity: 1; transform: scaleX(1); }
}

@keyframes qqz-codex-reveal {
    0% { opacity: 0; transform: translateY(-10px); filter: blur(2px); }
    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}
`;

  function log(...args) {
    if (!DEBUG) return;
    console.log('[ReasoningRegexStyler]', ...args);
  }

  function getTopDocument() {
    let host = window;
    for (let depth = 0; depth < 8; depth++) {
      try {
        const doc = host.document;
        if (doc?.getElementById('chat') && doc?.getElementById('send_textarea')) return doc;
        if (host.parent === host) break;
        host = host.parent;
      } catch { break; }
    }
    return document;
  }

  function getST() {
    if (typeof SillyTavern !== 'undefined') return SillyTavern;
    return null;
  }

  function getChatArray() {
    const st = getST();
    if (st && Array.isArray(st.chat)) return st.chat;
    if (Array.isArray(window.chat)) return window.chat;
    return null;
  }

  function updateBlock(messageId, message) {
    const st = getST();
    if (st && typeof st.updateMessageBlock === 'function') {
      st.updateMessageBlock(messageId, message);
      return;
    }
    if (typeof window.updateMessageBlock === 'function') {
      window.updateMessageBlock(messageId, message);
    }
  }

  function injectStyleOnce(doc) {
    if (!doc || !doc.head) return;
    let style = doc.getElementById(STYLE_ID);
    if (!style) {
      style = doc.createElement('style');
      style.id = STYLE_ID;
      doc.head.appendChild(style);
      log('style created', { inTop: doc === getTopDocument() });
    }
    style.textContent = REASONING_CSS;
  }

  function injectStyle() {
    injectStyleOnce(document);
    injectStyleOnce(getTopDocument());
    log('style injected', { cssLength: REASONING_CSS.length });
  }

  function removeStyle() {
    for (const doc of [document, getTopDocument()]) {
      const style = doc?.getElementById?.(STYLE_ID);
      if (style) style.remove();
    }
    log('style removed');
  }

  /**
   * 只提取回复开头的完整思考块；未闭合或位置不明确时保留原文。
   */
  function extractReasoningAndClean(text, isStreaming) {
    if (typeof text !== 'string') return null;
    const { prefix, suffix } = getReasoningConfig();
    if (!prefix || !suffix || prefix === suffix) return null;

    // 兼容既有 Recorder / START THINKING 预填，不扫描普通正文或代码块。
    const preamble = text.match(/^\s*(?:(?:Recorder\s*[:：]|\[START THINKING\])\s*)*/i)?.[0] || '';
    const start = preamble.length;
    const tagged = text.startsWith(prefix, start);
    const headless = /^Step\s+0\s*[:：]/i.test(text.slice(start));
    if (!tagged && !headless) return null;
    const contentStart = start + (tagged ? prefix.length : 0);
    const end = text.indexOf(suffix, contentStart);
    const incomplete = () => ({ complete: false, cleaned: text, state: isStreaming ? 'thinking' : 'none' });
    if (end < 0) return incomplete();
    const inner = text.slice(contentStart, end);
    // 嵌套或连续多个思考块存在歧义，先保留，不擅自合并或截断。
    if (inner.includes(prefix) || text.slice(end + suffix.length).trimStart().startsWith(prefix)) return incomplete();
    const reasoning = inner.trim();
    if (!reasoning) return incomplete();
    return {
      reasoning,
      cleaned: text.slice(end + suffix.length).replace(/^[\r\n]+/, ''),
      state: 'done',
      title: extractLatestHeaderByPriority(reasoning),
      complete: true,
    };
  }

  function normalizeHeaderText(str) {
    return String(str || '')
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();
  }

  function normalizeTpText(str) {
    return String(str || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s*\n\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function extractTpInfo(text) {
    const src = String(text || '');
    if (!src || !src.includes('<tp')) return null;

    const match = src.match(/<tp\b[^>]*>\s*([^@|<]*?)\s*(?:@\s*([^@|<]*?)\s*?)?(?:\|\s*([^<]*?)\s*)?<\/tp>/i);
    if (!match) return null;

    const time = normalizeTpText(match[1]);
    const location = normalizeTpText(match[2]);
    const weather = normalizeTpText(match[3]);

    if (!time && !location && !weather) return null;
    return { time, location, weather };
  }

  function findMessageDom(messageId) {
    const selector = `#chat [mesid="${messageId}"]`;
    const inFrame = document.querySelector(selector);
    if (inFrame) return inFrame;
    const topDoc = getTopDocument();
    return topDoc?.querySelector?.(selector) || null;
  }

  function resolveDisplayTitle(state, rawTitle) {
    void rawTitle;
    if (state === 'done' || state === 'thinking') return FIXED_REASONING_TITLE;
    return '';
  }

  function clipTitle(title, maxLen = 42) {
    const t = normalizeHeaderText(title);
    if (!t) return '';
    return t.length > maxLen ? t.slice(0, maxLen) : t;
  }

  function extractLatestHeaderByPriority(text) {
    const src = String(text || '');
    if (!src) return '';

    let best = null;

    const pick = (priority, index, rawTitle) => {
      const title = normalizeHeaderText(rawTitle);
      if (!title || /^[`~!@#$%^&*()_+\-=\[\]{};:'",.<>/?|\\]+$/.test(title)) return;

      if (!best || priority > best.priority || (priority === best.priority && index > best.index)) {
        best = { priority, index, title };
      }
    };

    // 优先级 3: # 标题 / ## 标题
    {
      const re = /^(#{1,2})\s+(.+)$/gm;
      let m;
      while ((m = re.exec(src)) !== null) {
        pick(3, m.index, m[2]);
      }
    }

    // 优先级 2: **标题**（行级）
    {
      const re = /(?:^|\n)\s*\*\*([^*\n][^*\n]*?)\*\*\s*(?=\n|$)/g;
      let m;
      while ((m = re.exec(src)) !== null) {
        pick(2, m.index, m[1]);
      }
    }

    // 优先级 1: - 标题 / • 标题
    {
      const re = /^\s*(?:-|•)\s+(.+)$/gm;
      let m;
      while ((m = re.exec(src)) !== null) {
        pick(1, m.index, m[1]);
      }
    }

    return best?.title || '';
  }

  // WeakMap 仅追踪当前页面中已完成的提取，不建立聊天外的持久缓存。
  const completedReasoning = new WeakMap();

  function captureReasoningScope(messageId) {
    const context = getST()?.getContext?.();
    const chat = getChatArray();
    const id = Number(messageId);
    if (!chat || !Number.isInteger(id) || id < 0 || !chat[id]) return null;
    return { chat, id, message: chat[id], chatId: context?.getCurrentChatId?.() };
  }

  function isReasoningScopeCurrent(scope) {
    const context = getST()?.getContext?.();
    return !!scope && getChatArray() === scope.chat && scope.chat[scope.id] === scope.message
      && context?.getCurrentChatId?.() === scope.chatId;
  }

  function isMessageStreaming(id) {
    const processor = getST()?.getContext?.()?.streamingProcessor;
    return !!processor && Number(processor.messageId) === id && !processor.isFinished && !processor.isStopped;
  }

  function synchronizeReasoningSwipe(message) {
    const swipeId = message.swipe_id;
    if (!Number.isInteger(swipeId) || swipeId < 0 || !Array.isArray(message.swipes)
      || !Array.isArray(message.swipe_info) || swipeId >= message.swipes.length
      || !message.swipe_info[swipeId] || typeof message.swipe_info[swipeId] !== 'object') return;
    message.swipes[swipeId] = message.mes;
    message.swipe_info[swipeId].extra = structuredClone(message.extra);
  }

  async function saveReasoningScope(scope) {
    if (!isReasoningScopeCurrent(scope) || isMessageStreaming(scope.id)) return;
    const context = getST()?.getContext?.();
    if (typeof context?.saveChat !== 'function') return;
    try {
      await context.saveChat();
    } catch {
      // 不记录消息正文或底层异常中的连接信息；正常保存入口负责用户提示。
      log('reasoning save failed');
    }
    // 保存等待期间如已换聊天，不再处理新聊天的消息或刷新新页面。
    if (!isReasoningScopeCurrent(scope)) return;
  }

  function applyReasoningToMessage(messageId, { finalize = false, scope = null } = {}) {
    const owner = scope || captureReasoningScope(messageId);
    if (!isReasoningScopeCurrent(owner)) return false;
    const { id, message } = owner;
    if (message.is_user || typeof message.mes !== 'string') return false;

    const isStreaming = isMessageStreaming(id);
    const parsed = extractReasoningAndClean(message.mes, isStreaming);
    const generation = String(message.gen_started ?? '');
    const prior = completedReasoning.get(message);
    const reusable = prior && prior.generation === generation && prior.swipeId === message.swipe_id
      && prior.cleaned === message.mes;
    let changed = false;

    // 渲染/历史加载只更新展示。真正收到或编辑完成的消息才进行持久提取。
    if (finalize && !isStreaming) {
      const result = parsed?.complete ? parsed : (reusable && message.extra?.reasoning_type !== 'parsed' ? prior : null);
      if (result) {
        const nextExtra = { ...(message.extra || {}) };
        const existingReasoning = nextExtra.reasoning;
        if (existingReasoning && existingReasoning !== result.reasoning) {
          nextExtra.astraea_reasoning_backup = {
            text: existingReasoning,
            type: nextExtra.reasoning_type ?? null,
          };
        }
        nextExtra.reasoning = result.reasoning;
        nextExtra.reasoning_type = 'parsed';
        nextExtra.reasoning_state = 'done';
        nextExtra.reasoning_header_title = FIXED_REASONING_TITLE;
        // 先保存完整内容及已有 reasoning，再清理对应正文块。
        message.extra = nextExtra;
        message.mes = result.cleaned;
        synchronizeReasoningSwipe(message);
        completedReasoning.set(message, {
          reasoning: result.reasoning, cleaned: result.cleaned,
          generation, swipeId: message.swipe_id,
        });
        changed = true;
        updateBlock(id, message);
      }
    }

    const reasoning = String(message.extra?.reasoning || '');
    const state = isStreaming && (reasoning || parsed) ? 'thinking' : (reasoning ? 'done' : 'none');
    const title = state === 'none' ? '' : clipTitle(resolveDisplayTitle(state, extractLatestHeaderByPriority(reasoning)));
    updateReasoningUIState(id, state, title, extractTpInfo(String(message.mes ?? '')));
    return changed;
  }

  function updateReasoningTpMeta(messageDom, tpInfo) {
    const header = messageDom.querySelector('.mes_reasoning_header');
    if (!header) return;

    let meta = header.querySelector('.qqz_reasoning_tp_meta');
    if (!meta) {
      meta = document.createElement('div');
      meta.className = 'qqz_reasoning_tp_meta';
      meta.innerHTML = [
        "<div class=\"qqz_reasoning_tp_line qqz_reasoning_tp_line--time\"><span class=\"qqz_reasoning_tp_label\">時間</span><span class=\"qqz_reasoning_tp_value\"></span></div>",
        "<div class=\"qqz_reasoning_tp_line qqz_reasoning_tp_line--location\"><span class=\"qqz_reasoning_tp_label\">場所</span><span class=\"qqz_reasoning_tp_value\"></span></div>",
        "<div class=\"qqz_reasoning_tp_line qqz_reasoning_tp_line--weather\"><span class=\"qqz_reasoning_tp_label\">天候</span><span class=\"qqz_reasoning_tp_value\"></span></div>"
      ].join('');
      header.appendChild(meta);
    }

    const rows = {
      time: meta.querySelector('.qqz_reasoning_tp_line--time'),
      location: meta.querySelector('.qqz_reasoning_tp_line--location'),
      weather: meta.querySelector('.qqz_reasoning_tp_line--weather')
    };

    const values = {
      time: rows.time?.querySelector('.qqz_reasoning_tp_value'),
      location: rows.location?.querySelector('.qqz_reasoning_tp_value'),
      weather: rows.weather?.querySelector('.qqz_reasoning_tp_value')
    };

    const fields = {
      time: normalizeTpText(tpInfo?.time),
      location: normalizeTpText(tpInfo?.location),
      weather: normalizeTpText(tpInfo?.weather)
    };

    let visibleCount = 0;
    for (const key of ['time', 'location', 'weather']) {
      const row = rows[key];
      const valueNode = values[key];
      const value = fields[key];
      if (!row || !valueNode) continue;

      if (value) {
        valueNode.textContent = value;
        row.hidden = false;
        visibleCount += 1;
      } else {
        valueNode.textContent = '';
        row.hidden = true;
      }
    }

    meta.hidden = visibleCount === 0;
  }

  /**
   * 强制同步 DOM 状态属性
   */
  function updateReasoningUIState(messageId, state, title, tpInfo) {
    requestAnimationFrame(() => {
      const messageDom = findMessageDom(messageId);
      if (!messageDom) return;

      // 【核心】给根节点挂载状态，通过 CSS 物理遮断正文渲染
      if (state === 'thinking') {
        messageDom.setAttribute('data-reasoning-state', 'thinking');
        messageDom.setAttribute('data-is-thinking', 'true');
      } else if (state === 'done') {
        messageDom.setAttribute('data-reasoning-state', 'done');
        messageDom.removeAttribute('data-is-thinking');
      } else {
        messageDom.removeAttribute('data-reasoning-state');
        messageDom.removeAttribute('data-is-thinking');
      }

      const mesDetails = messageDom.querySelector('.mes_reasoning_details');

      if (mesDetails) {
        if (mesDetails.getAttribute('data-state') !== state) {
          mesDetails.setAttribute('data-state', state);
        }
        const config = getReasoningConfig();
        if (state === 'thinking' && config.auto_expand) {
          if (!mesDetails.open) mesDetails.open = true;
        }
      }

      const mesTitle = messageDom.querySelector('.mes_reasoning_header_title');
      if (mesTitle) {
        const finalTitle = clipTitle(resolveDisplayTitle(state, title));
        const prevTitle = mesTitle.getAttribute('data-custom-title') || '';

        if (finalTitle) {
          if (prevTitle !== finalTitle) {
            mesTitle.setAttribute('data-animating', 'true');
            requestAnimationFrame(() => {
              mesTitle.setAttribute('data-custom-title', finalTitle);
              setTimeout(() => mesTitle.removeAttribute('data-animating'), 260);
            });
          }
        } else {
          mesTitle.removeAttribute('data-custom-title');
          mesTitle.removeAttribute('data-animating');
        }
      }

      updateReasoningTpMeta(messageDom, tpInfo);
    });
  }

  function applyReasoningToAllMessages() {
    const chat = getChatArray();
    if (!chat) return;
    for (let i = 0; i < chat.length; i++) applyReasoningToMessage(i);
  }

  let streamTickRaf = 0;
  let generationScope = null;
  let generationChat = null;

  function rememberGenerationScope(messageId) {
    const context = getST()?.getContext?.();
    if (!generationChat || generationChat.chat !== getChatArray() || generationChat.chatId !== context?.getCurrentChatId?.()) return null;
    const scope = captureReasoningScope(messageId);
    if (scope && !scope.message.is_user) generationScope = scope;
    return scope;
  }

  function scheduleApplyLatestAssistantMessage() {
    // 调度前捕获目标，切换聊天后不得把旧 token 事件作用于新聊天。
    const processor = getST()?.getContext?.()?.streamingProcessor;
    const scope = processor ? rememberGenerationScope(processor.messageId) : null;
    if (streamTickRaf || !scope) return;
    streamTickRaf = requestAnimationFrame(() => {
      streamTickRaf = 0;
      if (isReasoningScopeCurrent(scope)) applyReasoningToMessage(scope.id, { scope });
    });
  }

  async function finalizeReasoningScope(scope) {
    if (!isReasoningScopeCurrent(scope)) return;
    if (applyReasoningToMessage(scope.id, { finalize: true, scope })) {
      await saveReasoningScope(scope);
    }
  }

  function bindEvents() {
    if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
      eventOn(tavern_events.MESSAGE_UPDATED, async (messageId) => {
        const scope = captureReasoningScope(messageId);
        if (scope) completedReasoning.delete(scope.message);
        await finalizeReasoningScope(scope);
      });

      eventOn(tavern_events.MESSAGE_RECEIVED, async (messageId) => {
        const scope = rememberGenerationScope(messageId);
        await finalizeReasoningScope(scope);
      });

      eventOn(tavern_events.CHAT_CHANGED, () => {
        generationScope = null;
        generationChat = null;
        if (streamTickRaf) cancelAnimationFrame(streamTickRaf);
        streamTickRaf = 0;
        injectConfig();
        setTimeout(applyReasoningToAllMessages, 50);
      });

      eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (messageId) => {
        applyReasoningToMessage(messageId);
      });

      eventOn(tavern_events.STREAM_TOKEN_RECEIVED, scheduleApplyLatestAssistantMessage);

      if (tavern_events.GENERATION_STARTED) eventOn(tavern_events.GENERATION_STARTED, (type, options, dryRun) => {
        if (dryRun || type === 'quiet' || type === 'impersonate') return;
        generationScope = null;
        generationChat = { chat: getChatArray(), chatId: getST()?.getContext?.()?.getCurrentChatId?.() };
      });

      const finish = async () => {
        const context = getST()?.getContext?.();
        if (!generationChat || generationChat.chat !== getChatArray() || generationChat.chatId !== context?.getCurrentChatId?.()) return;
        const processor = context?.streamingProcessor;
        const scope = generationScope || (processor ? captureReasoningScope(processor.messageId) : null);
        await finalizeReasoningScope(scope);
        if (!processor || processor.isFinished || processor.isStopped) {
          generationScope = null;
          generationChat = null;
        }
      };
      if (tavern_events.GENERATION_ENDED) eventOn(tavern_events.GENERATION_ENDED, finish);
      if (tavern_events.GENERATION_STOPPED) eventOn(tavern_events.GENERATION_STOPPED, finish);
    } else {
      log('eventOn/tavern_events not available');
    }
  }
  function init() {
    injectConfig();
    injectStyle();
    bindEvents();

    setTimeout(applyReasoningToAllMessages, 100);
    setTimeout(applyReasoningToAllMessages, 800);

    $(window).on('pagehide', removeStyle);
    log('loaded', { scriptId: SCRIPT_ID, debug: DEBUG });
  }

  $(() => init());
})();
