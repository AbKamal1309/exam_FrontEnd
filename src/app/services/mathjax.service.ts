// src/app/services/mathjax.service.ts
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class MathJaxService {

    constructor(private sanitizer: DomSanitizer) {}

    // ─────────────────────────────────────────────────────────────
    //  POINT D'ENTRÉE
    // ─────────────────────────────────────────────────────────────
    renderTextWithMath(text: string): SafeHtml {
        if (!text) return this.sanitizer.bypassSecurityTrustHtml('');
        return this.sanitizer.bypassSecurityTrustHtml(this.process(text));
    }

    // ─────────────────────────────────────────────────────────────
    //  PIPELINE (ordre critique — ne pas modifier l'ordre)
    // ─────────────────────────────────────────────────────────────
    private process(raw: string): string {
        let s = raw;

        // 1. Intégrales avec bornes  AVANT tout remplacement de \int
        s = this.processIntegrals(s);

        // 2. Sommes / Produits avec bornes  AVANT \sum / \prod
        s = this.processSumsProducts(s);

        // 3. Limites avec condition  AVANT \lim
        s = this.processLimits(s);

        // 4. Fractions imbriquées  \frac{num}{den}
        //    ⚠ DOIT être AVANT le nettoyage des accolades
        s = this.processFractions(s);

        // 5. Racines  \sqrt[n]{x}  \sqrt{x}  \sqrt x
        s = this.processSqrt(s);

        // 5b. Accents  \vec{x}  \hat{x}  \bar{x}
        //     ⚠ DOIT être AVANT le remplacement générique des accolades
        s = this.processAccents(s);

        // 6. Exposants / indices avec accolades  ^{...}  _{...}
        s = this.processBracketedSupSub(s);

        // 7. Remplacement LaTeX → Unicode
        //    ⚠ Utilise des littéraux regex, JAMAIS new RegExp(string)
        //      car les séquences d'échappement JS (\f, \n…) corrompent les clés
        s = this.replaceLatexCommands(s);

        // 8. Exposants / indices simples  ^x  _x  (après Unicode pour ne pas toucher HTML)
        s = this.processSimpleSupSub(s);

        // 9. Nettoyer les accolades orphelines
        s = s.replace(/\{|\}/g, '');

        // 10. Blocs display  $$...$$
        s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_m, e) =>
            `<span class="math-display">${e.trim()}</span>`);

        // 11. Inline  $...$
        s = s.replace(/\$([^$\n]+?)\$/g, (_m, e) =>
            `<span class="math-inline">${e}</span>`);

        return s;
    }

    // ─────────────────────────────────────────────────────────────
    //  1. INTÉGRALES AVEC BORNES
    //  \int_{a}^{b}   \int^{b}_{a}   \int_a^b   \int
    //  + variantes \iint  \iiint  \oint
    // ─────────────────────────────────────────────────────────────
    private processIntegrals(s: string): string {
        // Ordre important : le plus long d'abord pour éviter que \iint soit capturé par \int
        const ops: Array<[RegExp, string]> = [
            [/\\iiint/g, '∭'],
            [/\\iint/g,  '∬'],
            [/\\oint/g,  '∮'],
            [/\\int/g,   '∫'],
        ];

        for (const [re, sym] of ops) {
            // Forme _{lo}^{hi} ou ^{hi}_{lo}
            const pat1 = new RegExp(
                re.source + '(?:_\\{([^}]*)\\})?(?:\\^\\{([^}]*)\\})?', 'g');
            const pat2 = new RegExp(
                re.source + '(?:\\^\\{([^}]*)\\})?(?:_\\{([^}]*)\\})?', 'g');

            s = s.replace(pat1, (_m, lo, hi) => this.buildIntegral(sym, lo ?? '', hi ?? ''));
            s = s.replace(pat2, (_m, hi, lo) => this.buildIntegral(sym, lo ?? '', hi ?? ''));

            // Forme simple _a^b
            const pat3 = new RegExp(re.source + '_([a-zA-Z0-9∞])\\^([a-zA-Z0-9∞])', 'g');
            const pat4 = new RegExp(re.source + '\\^([a-zA-Z0-9∞])_([a-zA-Z0-9∞])', 'g');
            s = s.replace(pat3, (_m, lo, hi) => this.buildIntegral(sym, lo, hi));
            s = s.replace(pat4, (_m, hi, lo) => this.buildIntegral(sym, lo, hi));
        }
        return s;
    }

    private buildIntegral(sym: string, lo: string, hi: string): string {
        if (!lo && !hi) return `<span class="math-op">${sym}</span>`;
        return (
            `<span class="math-integral">` +
            `<span class="math-op-symbol">${sym}</span>` +
            `<span class="math-bounds">` +
            `<span class="math-bound-upper">${hi}</span>` +
            `<span class="math-bound-lower">${lo}</span>` +
            `</span>` +
            `</span>`
        );
    }

    // ─────────────────────────────────────────────────────────────
    //  2. SOMMES ET PRODUITS  \sum_{i=0}^{n}  \prod_{k=1}^{N}
    // ─────────────────────────────────────────────────────────────
    private processSumsProducts(s: string): string {
        // Forme avec bornes
        s = s.replace(/\\sum(?:_\{([^}]*)\})?(?:\^\{([^}]*)\})?/g, (_m, lo, hi) =>
            this.buildSigma('Σ', lo ?? '', hi ?? ''));
        s = s.replace(/\\prod(?:_\{([^}]*)\})?(?:\^\{([^}]*)\})?/g, (_m, lo, hi) =>
            this.buildSigma('∏', lo ?? '', hi ?? ''));
        return s;
    }

    private buildSigma(sym: string, lo: string, hi: string): string {
        if (!lo && !hi) return sym;
        return (
            `<span class="math-sigma">` +
            `<span class="math-bound-upper">${hi}</span>` +
            `<span class="math-op-symbol">${sym}</span>` +
            `<span class="math-bound-lower">${lo}</span>` +
            `</span>`
        );
    }

    // ─────────────────────────────────────────────────────────────
    //  3. LIMITES  \lim_{x \to 0}
    // ─────────────────────────────────────────────────────────────
    private processLimits(s: string): string {
        s = s.replace(/\\lim_\{([^}]*)\}/g, (_m, cond) => {
            const c = cond.replace(/\\to\b/g, '→').replace(/\\rightarrow/g, '→');
            return (
                `<span class="math-lim">` +
                `<span class="math-lim-op">lim</span>` +
                `<span class="math-lim-cond">${c}</span>` +
                `</span>`
            );
        });
        s = s.replace(/\\lim\b/g, '<span class="math-lim-op">lim</span>');
        return s;
    }

    // ─────────────────────────────────────────────────────────────
    //  4. FRACTIONS  \frac{num}{den}
    //  Boucle while pour gérer les fractions imbriquées
    // ─────────────────────────────────────────────────────────────
    private processFractions(s: string): string {
        // Forme \frac{num}{den} — boucle pour imbrication
        let prev = '';
        while (prev !== s) {
            prev = s;
            s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_m, num, den) =>
                `<span class="math-fraction">` +
                `<span class="fraction-num">${num}</span>` +
                `<span class="fraction-line"></span>` +
                `<span class="fraction-den">${den}</span>` +
                `</span>`
            );
        }

        // Forme simple \frac a b (un seul caractère chacun)
        s = s.replace(/\\frac\s+([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, (_m, num, den) =>
            `<span class="math-fraction">` +
            `<span class="fraction-num">${num}</span>` +
            `<span class="fraction-line"></span>` +
            `<span class="fraction-den">${den}</span>` +
            `</span>`
        );

        return s;
    }

    // ─────────────────────────────────────────────────────────────
    //  5. RACINES
    // ─────────────────────────────────────────────────────────────
    private processSqrt(s: string): string {
        // \sqrt[n]{x} — racine n-ième
        s = s.replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, (_m, idx, content) =>
            `<span class="math-sqrt">` +
            `<sup class="sqrt-index">${idx}</sup>` +
            `√<span class="sqrt-content">${content}</span>` +
            `</span>`
        );
        // \sqrt{x}
        s = s.replace(/\\sqrt\{([^}]*)\}/g, (_m, content) =>
            `<span class="math-sqrt">√<span class="sqrt-content">${content}</span></span>`
        );
        // \sqrt x
        s = s.replace(/\\sqrt\s+([a-zA-Z0-9])/g, (_m, content) =>
            `<span class="math-sqrt">√<span class="sqrt-content">${content}</span></span>`
        );
        return s;
    }

    // ─────────────────────────────────────────────────────────────
    //  5b. ACCENTS  \vec{x}  \hat{x}  \bar{x}
    //  Utilise des caractères Unicode combinants placés APRÈS
    //  le contenu, ce qui les fait s'afficher au-dessus du dernier
    //  caractère du contenu (comportement standard des diacritiques
    //  combinants Unicode).
    // ─────────────────────────────────────────────────────────────
    private processAccents(s: string): string {
        // \vec{x} → flèche au-dessus (vecteur)
        s = s.replace(/\\vec\{([^}]*)\}/g, (_m, content) =>
            `<span class="math-accent">${content}\u20D7</span>`
        );
        // \hat{x} → chapeau (accent circonflexe)
        s = s.replace(/\\hat\{([^}]*)\}/g, (_m, content) =>
            `<span class="math-accent">${content}\u0302</span>`
        );
        // \bar{x} → barre horizontale (moyenne, complexe conjugué…)
        s = s.replace(/\\bar\{([^}]*)\}/g, (_m, content) =>
            `<span class="math-accent">${content}\u0305</span>`
        );
        return s;
    }

    // ─────────────────────────────────────────────────────────────
    //  6. EXPOSANTS / INDICES AVEC ACCOLADES  ^{...}  _{...}
    // ─────────────────────────────────────────────────────────────
    private processBracketedSupSub(s: string): string {
        s = s.replace(/\^\{([^}]*)\}/g, (_m, v) => `<sup>${v}</sup>`);
        s = s.replace(/_\{([^}]*)\}/g,   (_m, v) => `<sub>${v}</sub>`);
        return s;
    }

    // ─────────────────────────────────────────────────────────────
    //  7. REMPLACEMENT LaTeX → UNICODE
    //
    //  ⚠ RÈGLE ABSOLUE : utiliser des LITTÉRAUX regex /pattern/g
    //     et JAMAIS new RegExp('\\xxx') car JavaScript interprète
    //     les séquences d'échappement dans les strings :
    //       '\\f'  →  '\f'  (form feed, 0x0C)  ← CAUSE DU BUG \frac
    //       '\\n'  →  '\n'  (newline)
    //       '\\t'  →  '\t'  (tab)
    //     Avec un littéral regex /\\frac/g, le double backslash
    //     est littéral et matche bien le caractère '\' suivi de 'f','r','a','c'.
    //
    //  ⚠ ORDRE : du plus LONG au plus COURT pour éviter les collisions
    //     \infty avant \in   (sinon \infty → ∈fty)
    //     \iint  avant \int  (sinon \iint  → ∫t)
    //     \notin avant \in   etc.
    //     \supseteq avant \supset  (sinon \supseteq → ⊃eq)
    // ─────────────────────────────────────────────────────────────
    private replaceLatexCommands(s: string): string {

        // ── Intégrales restantes (normalement déjà traitées) ──
        s = s.replace(/\\iiint/g,  '∭');
        s = s.replace(/\\iint/g,   '∬');
        s = s.replace(/\\oint/g,   '∮');
        s = s.replace(/\\int/g,    '∫');

        // ── Infini AVANT \in ──
        s = s.replace(/\\infty/g,  '∞');

        // ── Ensembles (longs avant courts) ──
        s = s.replace(/\\notin/g,       '∉');
        s = s.replace(/\\subseteq/g,    '⊆');
        s = s.replace(/\\supseteq/g,    '⊇');
        s = s.replace(/\\varnothing/g,  '∅');
        s = s.replace(/\\emptyset/g,    '∅');
        s = s.replace(/\\subset/g,      '⊂');
        s = s.replace(/\\supset/g,      '⊃');
        s = s.replace(/\\cup/g,         '∪');
        s = s.replace(/\\cap/g,         '∩');
        s = s.replace(/\\in\b/g,        '∈');   // \b = word boundary

        // ── Flèches (longues avant courtes) ──
        s = s.replace(/\\Longrightarrow/g, '⟹');
        s = s.replace(/\\longrightarrow/g, '⟶');
        s = s.replace(/\\Leftrightarrow/g, '⇔');
        s = s.replace(/\\leftrightarrow/g, '↔');
        s = s.replace(/\\Rightarrow/g,     '⇒');
        s = s.replace(/\\rightarrow/g,     '→');
        s = s.replace(/\\leftarrow/g,      '←');
        s = s.replace(/\\mapsto/g,         '↦');
        s = s.replace(/\\uparrow/g,        '↑');
        s = s.replace(/\\downarrow/g,      '↓');
        s = s.replace(/\\to\b/g,           '→');

        // ── Opérateurs ──
        s = s.replace(/\\partial/g,  '∂');
        s = s.replace(/\\nabla/g,    '∇');
        s = s.replace(/\\times/g,    '×');
        s = s.replace(/\\div/g,      '÷');
        s = s.replace(/\\pm/g,       '±');
        s = s.replace(/\\mp/g,       '∓');
        s = s.replace(/\\cdot/g,     '·');
        s = s.replace(/\\circ/g,     '∘');
        s = s.replace(/\\oplus/g,    '⊕');
        s = s.replace(/\\otimes/g,   '⊗');

        // ── Comparaisons ──
        s = s.replace(/\\approx/g,   '≈');
        s = s.replace(/\\equiv/g,    '≡');
        s = s.replace(/\\cong/g,     '≅');
        s = s.replace(/\\neq/g,      '≠');
        s = s.replace(/\\leq/g,      '≤');
        s = s.replace(/\\geq/g,      '≥');
        s = s.replace(/\\ll/g,       '≪');
        s = s.replace(/\\gg/g,       '≫');
        s = s.replace(/\\propto/g,   '∝');
        s = s.replace(/\\sim/g,      '∼');

        // ── Logique ──
        s = s.replace(/\\forall/g,    '∀');
        s = s.replace(/\\exists/g,    '∃');
        s = s.replace(/\\neg/g,       '¬');
        s = s.replace(/\\land/g,      '∧');
        s = s.replace(/\\lor/g,       '∨');
        s = s.replace(/\\therefore/g, '∴');
        s = s.replace(/\\because/g,   '∵');

        // ── Quantificateurs / Calcul ──
        s = s.replace(/\\sum/g,      'Σ');
        s = s.replace(/\\prod/g,     '∏');

        // ── Fonctions (longues avant courtes) ──
        s = s.replace(/\\arctan/g,   'arctan');
        s = s.replace(/\\arcsin/g,   'arcsin');
        s = s.replace(/\\arccos/g,   'arccos');
        s = s.replace(/\\sinh/g,     'sinh');
        s = s.replace(/\\cosh/g,     'cosh');
        s = s.replace(/\\tanh/g,     'tanh');
        s = s.replace(/\\sin/g,      'sin');
        s = s.replace(/\\cos/g,      'cos');
        s = s.replace(/\\tan/g,      'tan');
        s = s.replace(/\\log/g,      'log');
        s = s.replace(/\\ln/g,       'ln');
        s = s.replace(/\\exp/g,      'exp');
        s = s.replace(/\\max/g,      'max');
        s = s.replace(/\\min/g,      'min');
        s = s.replace(/\\lim\b/g,    'lim');

        // ── Lettres grecques MAJUSCULES ──
        s = s.replace(/\\Gamma/g,    'Γ');
        s = s.replace(/\\Delta/g,    'Δ');
        s = s.replace(/\\Theta/g,    'Θ');
        s = s.replace(/\\Lambda/g,   'Λ');
        s = s.replace(/\\Pi/g,       'Π');
        s = s.replace(/\\Sigma/g,    'Σ');
        s = s.replace(/\\Phi/g,      'Φ');
        s = s.replace(/\\Psi/g,      'Ψ');
        s = s.replace(/\\Omega/g,    'Ω');

        // ── Lettres grecques minuscules ──
        s = s.replace(/\\alpha/g,    'α');
        s = s.replace(/\\beta/g,     'β');
        s = s.replace(/\\gamma/g,    'γ');
        s = s.replace(/\\delta/g,    'δ');
        s = s.replace(/\\varepsilon/g,'ε');
        s = s.replace(/\\epsilon/g,  'ε');
        s = s.replace(/\\zeta/g,     'ζ');
        s = s.replace(/\\eta/g,      'η');
        s = s.replace(/\\theta/g,    'θ');
        s = s.replace(/\\iota/g,     'ι');
        s = s.replace(/\\kappa/g,    'κ');
        s = s.replace(/\\lambda/g,   'λ');
        s = s.replace(/\\mu/g,       'μ');
        s = s.replace(/\\nu/g,       'ν');
        s = s.replace(/\\xi/g,       'ξ');
        s = s.replace(/\\pi/g,       'π');
        s = s.replace(/\\rho/g,      'ρ');
        s = s.replace(/\\sigma/g,    'σ');
        s = s.replace(/\\tau/g,      'τ');
        s = s.replace(/\\upsilon/g,  'υ');
        s = s.replace(/\\varphi/g,   'φ');
        s = s.replace(/\\phi/g,      'φ');
        s = s.replace(/\\chi/g,      'χ');
        s = s.replace(/\\psi/g,      'ψ');
        s = s.replace(/\\omega/g,    'ω');

        // ── Ensembles de nombres ──
        s = s.replace(/\\mathbb\{N\}/g, 'ℕ');
        s = s.replace(/\\mathbb\{Z\}/g, 'ℤ');
        s = s.replace(/\\mathbb\{Q\}/g, 'ℚ');
        s = s.replace(/\\mathbb\{R\}/g, 'ℝ');
        s = s.replace(/\\mathbb\{C\}/g, 'ℂ');

        // ── Géométrie ──
        s = s.replace(/\\perp/g,     '⊥');
        s = s.replace(/\\parallel/g, '∥');
        s = s.replace(/\\angle/g,    '∠');
        s = s.replace(/\\triangle/g, '△');
        s = s.replace(/\\square/g,   '□');

        // ── Divers ──
        s = s.replace(/\\cdots/g,    '⋯');
        s = s.replace(/\\ldots/g,    '…');
        s = s.replace(/\\vdots/g,    '⋮');
        s = s.replace(/\\ddots/g,    '⋱');
        s = s.replace(/\\bullet/g,   '•');
        s = s.replace(/\\langle/g,   '⟨');
        s = s.replace(/\\rangle/g,   '⟩');
        s = s.replace(/\\quad/g,     '\u2003');
        s = s.replace(/\\ /g,        '\u00A0');

        return s;
    }

    // ─────────────────────────────────────────────────────────────
    //  8. EXPOSANTS / INDICES SIMPLES  ^x  _x
    //  Après Unicode pour ne pas toucher aux attributs HTML
    // ─────────────────────────────────────────────────────────────
    private processSimpleSupSub(s: string): string {
        // Lookahead négatif pour ne pas traiter à l'intérieur des balises HTML
        s = s.replace(/\^(?!<)([a-zA-Z0-9])/g, (_m, v) => `<sup>${v}</sup>`);
        s = s.replace(/_(?!<)([a-zA-Z0-9])/g,   (_m, v) => `<sub>${v}</sub>`);
        return s;
    }

    // ─────────────────────────────────────────────────────────────
    //  UTILITAIRE : texte brut sans HTML
    // ─────────────────────────────────────────────────────────────
    toPlainText(text: string): string {
        return this.process(text).replace(/<[^>]+>/g, '');
    }
}