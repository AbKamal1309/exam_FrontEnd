// src/app/components/math-editor/math-editor.component.ts
import {
  Component, forwardRef, Input, Output, EventEmitter,
  ChangeDetectorRef, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MathJaxService } from '../../services/mathjax.service';
import {LangService} from "../../services/lang.service";

@Component({
  selector: 'app-math-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './math-editor.component.html',
  styleUrls: ['./math-editor.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MathEditorComponent),
    multi: true
  }]
})
export class MathEditorComponent implements ControlValueAccessor {

  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() descriptionChange = new EventEmitter<string>();

  // ⚠ @ViewChild sur le textarea de CE composant
  @ViewChild('mathTextarea') private textareaRef!: ElementRef<HTMLTextAreaElement>;

  value = '';
  description = '';

  // Toolbar, description et aperçu masqués par défaut
  showToolbar = false;
  showDescription = false;
  showPreview = false;

  previewHtml: SafeHtml = '';

  private onChangeCb: (v: string) => void = () => {};
  private onTouchedCb: () => void = () => {};

  constructor(
      private mathJax: MathJaxService,
      private sanitizer: DomSanitizer,
      private cdr: ChangeDetectorRef,
      public lang: LangService
  ) {}

  // ── Insérer à la position du curseur ──────────────────────────
  insert(text: string): void {
    const ta = this.textareaRef?.nativeElement;
    if (!ta) {
      this.value += text;
    } else {
      const s = ta.selectionStart ?? this.value.length;
      const e = ta.selectionEnd ?? this.value.length;
      this.value = this.value.slice(0, s) + text + this.value.slice(e);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(s + text.length, s + text.length);
      });
    }
    this.emit();
    if (this.showPreview) this.updatePreview();
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLTextAreaElement).value;
    this.emit();
    if (this.showPreview) this.updatePreview();
  }

  onDescriptionChange(): void {
    this.descriptionChange.emit(this.description);
  }

  toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
    if (this.showPreview) this.updatePreview();
  }

  private emit(): void {
    this.onChangeCb(this.value);
    this.valueChange.emit(this.value);
  }

  private updatePreview(): void {
    this.previewHtml = this.value
        ? this.mathJax.renderTextWithMath(this.value)
        : this.sanitizer.bypassSecurityTrustHtml('');
    this.cdr.detectChanges();
  }

  // ── ControlValueAccessor ──────────────────────────────────────
  writeValue(v: string): void {
    this.value = v ?? '';
    if (this.showPreview) this.updatePreview();
  }
  registerOnChange(fn: (v: string) => void): void { this.onChangeCb = fn; }
  registerOnTouched(fn: () => void): void { this.onTouchedCb = fn; }
  setDisabledState(_d: boolean): void {}
}