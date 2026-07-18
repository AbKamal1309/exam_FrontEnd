// src/app/services/math-render.service.ts
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare const MathJax: any;

@Injectable({
    providedIn: 'root'
})
export class MathRenderService {

    private mathJaxLoaded = false;

    constructor(private sanitizer: DomSanitizer) {}

    /**
     * Charge MathJax si nécessaire
     */
    loadMathJax(): Promise<void> {
        return new Promise((resolve) => {
            if (this.mathJaxLoaded) {
                resolve();
                return;
            }

            // Si MathJax est déjà chargé globalement
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                this.mathJaxLoaded = true;
                resolve();
                return;
            }

            // Créer un élément script pour charger MathJax
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
            script.async = true;
            script.onload = () => {
                // Configurer MathJax
                if (typeof MathJax !== 'undefined') {
                    MathJax.typesetPromise = MathJax.typesetPromise || function() {
                        return Promise.resolve();
                    };
                    this.mathJaxLoaded = true;
                    resolve();
                } else {
                    resolve();
                }
            };
            script.onerror = () => {
                console.warn('Impossible de charger MathJax');
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Rend une expression mathématique en HTML avec MathJax
     */
    async renderTextWithMath(text: string): Promise<SafeHtml> {
        if (!text) return this.sanitizer.bypassSecurityTrustHtml('');

        // Attendre le chargement de MathJax
        await this.loadMathJax();

        // Nettoyer le texte
        const cleanText = text.trim();

        // Vérifier si c'est du LaTeX (contient des backslashes, des accolades, etc.)
        const latexPattern = /\\[a-zA-Z]+|[_^]|[{]|[}]/;
        const isLatex = latexPattern.test(cleanText);

        if (isLatex) {
            try {
                // Si MathJax est disponible, l'utiliser
                if (typeof MathJax !== 'undefined' && MathJax.tex2chtml) {
                    const html = MathJax.tex2chtml(cleanText, {
                        display: true
                    });
                    return this.sanitizer.bypassSecurityTrustHtml(html.outerHTML);
                } else {
                    // Fallback: afficher le texte avec des délimiteurs
                    return this.sanitizer.bypassSecurityTrustHtml(
                        `<div class="math-display">\\[${cleanText}\\]</div>`
                    );
                }
            } catch (error) {
                console.warn('Erreur de rendu MathJax:', error);
                return this.sanitizer.bypassSecurityTrustHtml(
                    `<div class="math-display">\\[${cleanText}\\]</div>`
                );
            }
        }

        // Texte simple
        return this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(cleanText));
    }

    /**
     * Rend un texte avec des délimiteurs LaTeX ($$...$$ ou $...$)
     */
    async renderLatexWithDelimiters(text: string): Promise<SafeHtml> {
        if (!text) return this.sanitizer.bypassSecurityTrustHtml('');

        await this.loadMathJax();

        let html = text;

        // $$...$$ (display mode)
        html = html.replace(/\$\$(.*?)\$\$/gs, (match, expr) => {
            if (typeof MathJax !== 'undefined' && MathJax.tex2chtml) {
                try {
                    const result = MathJax.tex2chtml(expr, { display: true });
                    return result.outerHTML;
                } catch (e) {
                    return match;
                }
            }
            return `<div class="math-display">\\[${expr}\\]</div>`;
        });

        // $...$ (inline mode)
        html = html.replace(/\$(.*?)\$/g, (match, expr) => {
            if (typeof MathJax !== 'undefined' && MathJax.tex2chtml) {
                try {
                    const result = MathJax.tex2chtml(expr, { display: false });
                    return result.outerHTML;
                } catch (e) {
                    return match;
                }
            }
            return `<span class="math-inline">\\(${expr}\\)</span>`;
        });

        return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m] || m; });
    }
}