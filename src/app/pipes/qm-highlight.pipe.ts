import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'qmHighlight'
})
export class QmHighlightPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) { }

  transform(value: any, args?: any): any {
    if (value === null) {
      return null;
    }

    if (!args) {
      return value;
    }
    // replace plus sign in phone number
    if (args.indexOf('+') > -1) {
      args = args.replace('+', '\\+');
    }
    // Match in a case insensitive manner
    const re = new RegExp(args, 'gi');
    const match = value.match(re);

    // If there's no match, just return the original value.
    if (!match) {
      return value;
    }

    const highlightedValue = value.replace(re, '<span class="qm-highlight">' + match[0] + '</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlightedValue);
  }

}
